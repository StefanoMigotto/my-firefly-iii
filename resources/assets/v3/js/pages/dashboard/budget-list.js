/*
 * budget-list.js
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

import formatMoney from "../../util/format-money.js";

function element(tag, className, text) {
    const el = document.createElement(tag);
    if (className) {
        el.className = className;
    }
    if (typeof text !== "undefined") {
        el.textContent = text;
    }
    return el;
}

/**
 * Renders the budgets of the current period as progress bars, using the
 * same data as the budget chart (api/v1/chart/budget/overview-with-limits).
 */
export function loadBudgetList(url, holder, settings) {
    const container = document.getElementById(holder);
    if (null === container) {
        return;
    }
    window.axios
        .get(url)
        .then((response) => {
            const rows = [];
            for (const current of response.data ?? []) {
                const spent = Math.abs(parseFloat(current.entries.spent) || 0);
                const budgeted = parseFloat(current.entries.budgeted) || 0;
                const left = parseFloat(current.entries.left) || 0;
                const overspent = parseFloat(current.entries.overspent) || 0;
                if (0 === budgeted) {
                    continue;
                }
                const used = spent;
                rows.push({
                    name: current.label,
                    currency: current.currency_code,
                    used: used,
                    budgeted: budgeted,
                    left: left,
                    overspent: Math.max(overspent, spent - budgeted),
                    percentage: Math.round((used / budgeted) * 100),
                });
            }
            container.innerHTML = "";
            if (0 === rows.length) {
                container.appendChild(element("p", "text-muted mb-0", settings.emptyText));
                return;
            }
            rows.sort((a, b) => b.percentage - a.percentage);
            const money = (amount, currency) => formatMoney(settings.anonymous ? 0 : amount, currency);
            for (const row of rows.slice(0, 6)) {
                const over = row.overspent > 0;
                const item = element("div", "ff-budget-row");

                const top = element("div", "ff-budget-top");
                top.appendChild(element("span", "ff-budget-name", row.name));
                const amounts = element("span", "ff-budget-amounts");
                amounts.appendChild(element("span", over ? "money-negative" : "", money(row.used, row.currency)));
                amounts.appendChild(element("span", "text-muted", " / " + money(row.budgeted, row.currency)));
                top.appendChild(amounts);
                item.appendChild(top);

                const track = element("div", "progress");
                track.setAttribute("role", "progressbar");
                track.setAttribute("aria-valuenow", String(Math.min(100, row.percentage)));
                track.setAttribute("aria-valuemin", "0");
                track.setAttribute("aria-valuemax", "100");
                const bar = element(
                    "div",
                    "progress-bar w-" + Math.min(100, Math.max(0, row.percentage)) + (over ? " bg-danger" : ""),
                );
                track.appendChild(bar);
                item.appendChild(track);

                const note = over
                    ? settings.overspentLabel + " " + money(row.overspent, row.currency)
                    : row.percentage + "% · " + settings.leftLabel + " " + money(row.left, row.currency);
                item.appendChild(element("div", over ? "ff-budget-note money-negative" : "ff-budget-note", note));
                container.appendChild(item);
            }
        })
        .catch((error) => {
            console.error(error);
            container.innerHTML = "";
            container.appendChild(element("p", "text-muted mb-0", settings.emptyText));
        });
}
