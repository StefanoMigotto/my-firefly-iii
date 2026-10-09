/*
 * dashboard.js
 * Copyright (c) 2026 james@firefly-iii.org
 *
 * This file is part of Firefly III (https://github.com/firefly-iii).
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import "../../boot/bootstrap.js";
import sidebar from "../../pages/shared/sidebar.js";
import dates from "../shared/dates.js";
import boxes from "./boxes.js";
import Alpine from "@alpinejs/csp";
import Get from "../../api/model/piggy-bank/get.js";
import formatMoney from "../../util/format-money.js";
import { getVariable } from "../../store/get-variable.js";
import { drawCategoryDonut, drawIncomeExpenseChart, drawMultiCurrencyChart } from "../../shared/draw-chart.js";
import { loadBudgetList } from "./budget-list.js";
import format from "../../util/format.js";

let index = function () {
    return {
        piggyBanks: [],
        anonymous: false,
        loadingPiggyBanks: true,
        init() {
            getVariable("anonymous").then((value) => {
                let start = new Date(window.store.get("start"));
                let end = new Date(window.store.get("end"));
                this.anonymous = value;
                this.loadPiggyBanks();
                drawMultiCurrencyChart(
                    "line",
                    "api/v1/chart/account/overview?period=1D&start=" +
                        format(start, "yyyy-LL-dd") +
                        "&end=" +
                        format(end, "yyyy-LL-dd"),
                    "accounts-chart",
                    value,
                    true,
                    true,
                );

                this.drawDashboardWidgets(start, end, value);
            });
        },
        drawDashboardWidgets(start, end, anonymous) {
            // labels come from the server-side translations (data attributes).
            const labels = document.getElementById("dashboard-labels").dataset;

            drawCategoryDonut("chart/category/frontpage", "categories-chart", {
                legend: "categories-legend",
                total: "categories-total",
                otherLabel: labels.other,
                anonymous: anonymous,
            });

            // income and expenses for the last six months, ending with the current period.
            const sixMonthsAgo = new Date(start.getFullYear(), start.getMonth() - 5, 1);
            drawIncomeExpenseChart(
                "api/v1/chart/balance/balance?period=1M&start=" +
                    format(sixMonthsAgo, "yyyy-LL-dd") +
                    "&end=" +
                    format(end, "yyyy-LL-dd"),
                "income-expense-chart",
                {
                    earnedLabel: labels.earned,
                    spentLabel: labels.spent,
                    anonymous: anonymous,
                },
            );

            loadBudgetList(
                "api/v1/chart/budget/overview-with-limits?start=" +
                    format(start, "yyyy-LL-dd") +
                    "&end=" +
                    format(end, "yyyy-LL-dd"),
                "budget-list",
                {
                    leftLabel: labels.left,
                    overspentLabel: labels.overspent,
                    emptyText: labels.noBudgets,
                    anonymous: anonymous,
                },
            );
        },
        loadPiggyBanks() {
            this.downloadPiggyBanks(1);
        },
        downloadPiggyBanks(page) {
            new Get().list({ page: page }).then((response) => {
                for (let i = 0; i < response.data.data.length; i++) {
                    if (Object.hasOwn(response.data.data, i)) {
                        let current = response.data.data[i];
                        let currentAmount =
                            null === current.attributes.current_amount ? "0" : current.attributes.current_amount;
                        let targetAmount =
                            null === current.attributes.target_amount ? "0" : current.attributes.target_amount;
                        let piggy = {
                            id: current.id,
                            name: current.attributes.name,
                            percentage:
                                null === current.attributes.percentage ? 0 : parseInt(current.attributes.percentage),
                            amount:
                                formatMoney(currentAmount, current.attributes.currency_code) +
                                " / " +
                                formatMoney(targetAmount, current.attributes.currency_code),
                        };
                        if (null === current.attributes.target_amount) {
                            piggy.amount = formatMoney(currentAmount, current.attributes.currency_code) + " / ∞";
                        }
                        if (this.anonymous) {
                            piggy.amount = "- / -";
                        }

                        this.piggyBanks.push(piggy);
                    }
                }

                let totalPages = parseInt(response.data.meta.pagination.total_pages);
                if (totalPages > page) {
                    this.downloadPiggyBanks(page + 1);
                    return;
                }
                this.loadingPiggyBanks = false;
            });
        },
    };
};

const comps = {
    index,
    sidebar,
    boxes,
    dates,
};

function loadPage(comps) {
    // console.log("loadPage");
    Object.keys(comps).forEach((comp) => {
        let data = comps[comp]();
        Alpine.data(comp, () => data);
        // console.log(comp);
    });
    Alpine.start();
}

// wait for load until bootstrapped event is received.
document.addEventListener("firefly-iii-bootstrapped", () => {
    // console.log("Loaded through event listener.");
    loadPage(comps);
});
// or is bootstrapped before event is triggered.
if (window.bootstrapped) {
    // console.log("Loaded through window variable.");
    loadPage(comps);
}
