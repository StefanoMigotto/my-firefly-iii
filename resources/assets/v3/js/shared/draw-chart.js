/*
 * draw-chart.js
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

import Chart from "chart.js/auto";
import formatMoney from "../util/format-money.js";
import i18next from "i18next";
import format from "../util/format.js";
import annotationPlugin from "chartjs-plugin-annotation";

Chart.register(annotationPlugin);

const prefersReducedMotion =
    typeof globalThis.matchMedia === "function" && globalThis.matchMedia("(prefers-reduced-motion: reduce)").matches;

function cssVariable(name, fallback) {
    const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return "" === value ? fallback : value;
}

/**
 * Reads the chart colors from the theme tokens (see sass/theme/_tokens.scss),
 * so charts follow light and dark mode.
 */
export function chartTheme() {
    return {
        foreground: cssVariable("--ff-foreground", "#09090b"),
        muted: cssVariable("--ff-muted-foreground", "#71717a"),
        border: cssVariable("--ff-border", "#e4e4e7"),
        popover: cssVariable("--ff-popover", "#ffffff"),
        card: cssVariable("--ff-card", "#ffffff"),
        expense: cssVariable("--ff-chart-expense", "#f37761"),
        income: cssVariable("--ff-chart-income", "#34b3a0"),
        palette: [
            cssVariable("--ff-chart-1", "#2b7fa6"),
            cssVariable("--ff-chart-2", "#34b3a0"),
            cssVariable("--ff-chart-3", "#f2a33a"),
            cssVariable("--ff-chart-4", "#8b7cf6"),
            cssVariable("--ff-chart-5", "#f06a7f"),
            cssVariable("--ff-chart-6", "#a1a1aa"),
        ],
    };
}

export function withAlpha(color, alpha) {
    const hex = color.replace("#", "");
    if (6 !== hex.length) {
        return color;
    }
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return "rgba(" + r + ", " + g + ", " + b + ", " + alpha + ")";
}

/**
 * Vertical gradient from the series color to transparent, used to fill line charts.
 */
function verticalGradient(color) {
    return function (context) {
        const chartArea = context.chart.chartArea;
        if (!chartArea) {
            return withAlpha(color, 0.12);
        }
        const gradient = context.chart.ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
        gradient.addColorStop(0, withAlpha(color, 0.28));
        gradient.addColorStop(1, withAlpha(color, 0));
        return gradient;
    };
}

/**
 * Global look & feel: smooth lines, no points until hover, rounded bars,
 * light dashed grid and a card-like tooltip.
 */
function applyChartDefaults() {
    const theme = chartTheme();
    Chart.defaults.font.family = getComputedStyle(document.body).fontFamily;
    Chart.defaults.font.size = 12;
    Chart.defaults.color = theme.muted;
    Chart.defaults.borderColor = theme.border;
    Chart.defaults.animation.duration = prefersReducedMotion ? 0 : 400;
    Chart.defaults.animation.easing = "easeOutQuart";
    Chart.defaults.interaction.mode = "index";
    Chart.defaults.interaction.intersect = false;

    Chart.defaults.elements.line.borderWidth = 2.5;
    Chart.defaults.elements.line.tension = 0.4;
    Chart.defaults.elements.line.borderCapStyle = "round";
    Chart.defaults.elements.line.borderJoinStyle = "round";
    Chart.defaults.elements.point.radius = 0;
    Chart.defaults.elements.point.hoverRadius = 5;
    Chart.defaults.elements.point.hitRadius = 8;
    Chart.defaults.elements.point.hoverBorderWidth = 2;
    Chart.defaults.elements.bar.borderRadius = 5;
    Chart.defaults.elements.bar.borderSkipped = "start";
    Chart.defaults.elements.arc.borderWidth = 2;
    Chart.defaults.elements.arc.borderColor = theme.card;
    Chart.defaults.datasets.bar.maxBarThickness = 32;
    Chart.defaults.datasets.bar.categoryPercentage = 0.7;
    Chart.defaults.datasets.bar.barPercentage = 0.8;

    const tooltip = Chart.defaults.plugins.tooltip;
    tooltip.backgroundColor = theme.popover;
    tooltip.titleColor = theme.foreground;
    tooltip.bodyColor = theme.foreground;
    tooltip.footerColor = theme.muted;
    tooltip.borderColor = theme.border;
    tooltip.borderWidth = 1;
    tooltip.padding = 10;
    tooltip.cornerRadius = 8;
    tooltip.caretSize = 0;
    tooltip.caretPadding = 8;
    tooltip.boxWidth = 8;
    tooltip.boxHeight = 8;
    tooltip.boxPadding = 6;
    tooltip.usePointStyle = true;
    tooltip.titleFont = { weight: "600", size: 12 };
    tooltip.bodyFont = { size: 12 };
    tooltip.titleMarginBottom = 6;

    const legend = Chart.defaults.plugins.legend.labels;
    legend.usePointStyle = true;
    legend.pointStyle = "circle";
    legend.boxWidth = 8;
    legend.boxHeight = 8;
    legend.padding = 16;
}

/**
 * Value axis with a subtle dashed grid and compact ticks.
 */
function valueAxis(extra) {
    return {
        grid: {
            color: chartTheme().border,
            drawTicks: false,
        },
        border: {
            display: false,
            dash: [3, 3],
        },
        ...extra,
    };
}

function newChart(holder, config) {
    applyChartDefaults();
    const ctx = document.getElementById(holder).getContext("2d");
    return new Chart(ctx, config);
}

let defaultChartOptions = {
    elements: {
        line: {
            cubicInterpolationMode: "monotone",
        },
    },
    plugins: {
        legend: {
            display: false,
        },
        tooltip: {
            interaction: {
                mode: "index",
            },
            callbacks: {},
        },
    },
    responsive: true,
    maintainAspectRatio: false,
    scales: {
        x: {
            axis: "x",
            grid: {
                display: false,
            },
            border: {
                display: false,
            },
            ticks: {
                maxRotation: 0,
                autoSkipPadding: 16,
            },
        },
        y: valueAxis({
            display: true,
            beginAtZero: true,
            ticks: {
                maxTicksLimit: 5,
                padding: 8,
            },
        }),
    },
};

export function drawMultiCurrencyChart(type, url, holder, anonymous, drawTodayMarker, colorData) {
    if ("line" === type) {
        drawMultiCurrencyLineChart(url, holder, anonymous, drawTodayMarker, colorData);
        return;
    }
    if ("stacked-column" === type) {
        drawMultiCurrencyStackedColumnChart(url, holder, anonymous, colorData);
        return;
    }

    console.error('Cannot draw a "' + type + '" chart yet :(');
}

export function drawSingleCurrencyChart(type, url, holder, anonymous) {
    if ("line" === type) {
        drawSingleCurrencyLineChart(url, holder, anonymous);
        return;
    }
    console.error('Cannot draw a "' + type + '" chart yet :(');
}

function drawMultiCurrencyStackedColumnChart(url, holder, anonymous, colorData) {
    document.getElementById(holder).classList.remove("general-chart-error");
    window.axios
        .get(url)
        .then((response) => {
            // prep some chart variables first.
            let all = response.data;
            let axes = {};
            let data = {
                datasets: [],
                labels: [],
            };

            // make custom options set.
            let options = structuredClone(defaultChartOptions);

            //             interaction: {
            //                 mode: 'x'
            //             },
            options.plugins.tooltip.interaction.mode = "nearest";
            // options.plugins.tooltip.interaction.mode = 'index';
            // options.plugins.tooltip.interaction.axis = 'y';

            let datasets = {};
            // loop all collected data.
            for (let i = 0; i < all.length; i++) {
                if (Object.hasOwn(all, i)) {
                    let current = all[i];
                    let label = current.label + " (" + current.currency_code + ")";
                    //console.log("Now processing", label);

                    current.entries.spent = parseFloat(current.entries.spent);
                    current.entries.budgeted = parseFloat(current.entries.budgeted);
                    current.entries.left = parseFloat(current.entries.left);
                    current.entries.overspent = parseFloat(current.entries.overspent);
                    if (current.entries.spent < 0) {
                        current.entries.spent = current.entries.spent * -1;
                    }

                    // if there is NOTHING in this budget, skip it.
                    if (
                        0 === current.entries.budgeted &&
                        0 === current.entries.spent &&
                        0 === current.entries.left &&
                        0 === current.entries.overspent
                    ) {
                        continue;
                    }

                    // add the name as a label
                    data.labels.push(formatLabel(label, 25));
                    let labelIndex = data.labels.length - 1;

                    /*
                    ok dus je hebt al zes labels voor alle zes de budget/currency combinaties
                    dus je moet nu vier datasets maken. Die elk 6 entries hebben.
                     */
                    let keys = ["budgeted", "spent", "left", "overspent"];
                    for (let i in keys) {
                        let key = keys[i] + current.currency_code;
                        if (!Object.hasOwn(datasets, key)) {
                            datasets[key] = {
                                label: key,
                                data: [],
                                currency_code: current.currency_code,
                                yAxisID: "y" + current.currency_code,
                            };
                            // make sure that data set is all zeroes when we start:
                            for (let j = 0; j < all.length; j++) {
                                datasets[key].data.push(0);
                            }
                        }
                    }
                    // user has not overspent, and there was a budget set.
                    if (current.entries.spent < current.entries.budgeted && 0 !== current.entries.budgeted) {
                        // console.log('A: Is not overspent, and there was a budget', current.entries.spent, current.entries.budgeted);
                        let key = "budgeted" + current.currency_code;
                        datasets[key].data[labelIndex] = 0; // parseFloat(current.entries.budgeted);

                        key = "spent" + current.currency_code;
                        datasets[key].data[labelIndex] = current.entries.spent;

                        key = "left" + current.currency_code;
                        datasets[key].data[labelIndex] = current.entries.left;

                        key = "overspent" + current.currency_code;
                        datasets[key].data[labelIndex] = 0;
                    }
                    // user has overspent and there was a budget set.
                    if (current.entries.spent >= current.entries.budgeted && 0 !== current.entries.budgeted) {
                        // console.log('B: Is overspent, and there was a budget', current.entries.spent, current.entries.budgeted);
                        let key = "budgeted" + current.currency_code;
                        datasets[key].data[labelIndex] = current.entries.budgeted;

                        key = "spent" + current.currency_code;
                        datasets[key].data[labelIndex] = 0;

                        key = "left" + current.currency_code;
                        datasets[key].data[labelIndex] = 0;

                        key = "overspent" + current.currency_code;
                        datasets[key].data[labelIndex] = current.entries.overspent;
                    }

                    if (current.entries.spent >= current.entries.budgeted && 0 === current.entries.budgeted) {
                        // user has no budget set.
                        let key = "budgeted" + current.currency_code;
                        datasets[key].data[labelIndex] = 0;

                        key = "spent" + current.currency_code;
                        datasets[key].data[labelIndex] = current.entries.spent;

                        key = "left" + current.currency_code;
                        datasets[key].data[labelIndex] = 0;

                        key = "overspent" + current.currency_code;
                        datasets[key].data[labelIndex] = 0;
                    }

                    // if there is no axis yet for this currency, create one.
                    let currencyCode = current.currency_code;
                    let axisId = "y" + currencyCode;
                    if (!Object.hasOwn(axes, axisId)) {
                        axes[axisId] = valueAxis({
                            id: axisId,
                            type: "linear",
                            stacked: true,
                            position: 0 === Object.keys(axes).length % 2 ? "left" : "right",
                            ticks: {
                                maxTicksLimit: 5,
                                padding: 8,
                                callback: function (value) {
                                    if (anonymous) {
                                        value = "0";
                                    }
                                    return formatMoney(value, currencyCode);
                                },
                            },
                        });
                    }
                }
            }

            data.datasets = Object.values(datasets);
            // remove the standard y-axis, do not need it.
            delete options.scales.y;
            options.scales.x.stacked = true;
            // options.scales.y.stacked = true;
            // add the new axes.
            options.scales = { ...options.scales, ...axes };
            // console.log(options);
            // console.log(data);

            // add a callback for the title of the label:
            options.plugins.tooltip.callbacks.title = function (tooltipItems) {
                "use strict";
                return tooltipItems[0].label.replaceAll(",", " ");
            };

            // add a callback for the label.
            options.plugins.tooltip.callbacks.label = function (tooltipItem) {
                "use strict";
                let index = tooltipItem.dataIndex;
                let amount = tooltipItem.dataset.data[index];

                let string = formatMoney(amount, tooltipItem.dataset.currency_code);
                if (anonymous) {
                    string = formatMoney("0", tooltipItem.dataset.currency_code);
                }
                if (tooltipItem.dataset.label.startsWith("budgeted")) {
                    return i18next.t("firefly.budgeted") + ": " + string;
                }
                if (tooltipItem.dataset.label.startsWith("spent")) {
                    return i18next.t("firefly.spent") + ": " + string;
                }
                if (tooltipItem.dataset.label.startsWith("overspent")) {
                    return i18next.t("firefly.overspent") + ": " + string;
                }
                if (tooltipItem.dataset.label.startsWith("left")) {
                    return i18next.t("firefly.left") + ": " + string;
                }
                return tooltipItem.dataset.label + ": " + string;
            };

            // safety catch in case there is no data.
            if (
                typeof data === "undefined" ||
                0 === data.length ||
                (typeof data === "object" && typeof data.labels === "object" && 0 === data.labels.length)
            ) {
                let el = document.getElementById(holder).parentElement;
                el.innerHTML = "";
                el.classList.add("general-chart-error");
                el.innerText = i18next.t("firefly.no_data_for_chart");
                return;
            }

            if (colorData) {
                data = colorizeAllData(data, "bar");
            }

            newChart(holder, {
                type: "bar",
                data: data,
                options: options,
            });
        })
        .catch((error) => {
            console.error(error);
            let el = document.getElementById(holder).parentElement;
            el.innerHTML = "";
            el.classList.add("general-chart-error");
            el.innerText = i18next.t("firefly.could_not_load_chart") + " " + error;
        });
}

function drawMultiCurrencyLineChart(url, holder, anonymous, drawTodayMarker, colorData) {
    document.getElementById(holder).classList.remove("general-chart-error");
    window.axios
        .get(url)
        .then((response) => {
            // prep some chart variables first.
            let all = response.data;
            let axes = {};
            let data = {
                datasets: [],
                labels: [],
            };

            // make custom options set.
            let options = structuredClone(defaultChartOptions);

            // prep "today" marker.
            let today = new Date();
            let firstScale = ""; // used for today marker.
            let drawTodayLabel = "";
            let drawTodayIndex = 0;
            let labelCount;

            // loop all collected data.
            for (let i = 0; i < all.length; i++) {
                if (Object.hasOwn(all, i)) {
                    let current = all[i];
                    let currentCurrencyCode = current.currency_code;
                    let currentEntryKey = "entries";
                    if (
                        window.store.get("convert_to_primary") &&
                        current.currency_code !== current.primary_currency_code
                    ) {
                        currentCurrencyCode = current.primary_currency_code;
                        currentEntryKey = "pc_entries";
                    }

                    // first dataset, use the labels from that one
                    // find the place to set the "today" marker, and get FIRST y-axis ID.
                    firstScale = "y" + currentCurrencyCode;
                    labelCount = 0;
                    let locale = window.store.get("locale");
                    if (0 === i) {
                        for (let j in current[currentEntryKey]) {
                            if (Object.hasOwn(current[currentEntryKey], j)) {
                                labelCount++;

                                // is the marker to be set on this date?
                                let date = new Date(j);
                                if (drawTodayMarker && isSameDay(date, today)) {
                                    drawTodayLabel = j;
                                    drawTodayIndex = labelCount;
                                }
                                // add the label to the array
                                data.labels.push(
                                    format(date, i18next.t("config.month_and_day_fns", { lng: locale }), locale),
                                );
                            }
                        }
                    }

                    // for the first and all other datasets, create a new dataset object.
                    let dataset = {
                        label: current.label,
                        currency_code: currentCurrencyCode,
                        data: [],
                        yAxisID: "y" + currentCurrencyCode,
                    };
                    // add the data to the dataset.
                    for (let j in current[currentEntryKey]) {
                        if (Object.hasOwn(current[currentEntryKey], j)) {
                            dataset.data.push(current[currentEntryKey][j]);
                        }
                    }
                    // add it to the dataset collection.
                    data.datasets.push(dataset);

                    // if there is no axis yet for this currency, create one.
                    //let currencyCode = current.currency_code;
                    let axisId = "y" + currentCurrencyCode;
                    if (!Object.hasOwn(axes, axisId)) {
                        axes[axisId] = valueAxis({
                            id: axisId,
                            type: "linear",
                            position: 0 === Object.keys(axes).length % 2 ? "left" : "right",
                            ticks: {
                                maxTicksLimit: 5,
                                padding: 8,
                                callback: function (value) {
                                    if (anonymous) {
                                        value = "0";
                                    }
                                    return formatMoney(value, currentCurrencyCode);
                                },
                            },
                        });
                    }
                }
            }
            // remove the standard y-axis, do not need it.
            delete options.scales.y;
            // options.scales.y.stacked = true;
            // add the new axes.
            options.scales = { ...options.scales, ...axes };

            // add a callback for the label.
            options.plugins.tooltip.callbacks.label = function (tooltipItem) {
                "use strict";
                let index = tooltipItem.dataIndex;
                let amount = tooltipItem.dataset.data[index];

                let string = formatMoney(amount, tooltipItem.dataset.currency_code);
                if (anonymous) {
                    string = formatMoney("0", tooltipItem.dataset.currency_code);
                }
                return tooltipItem.dataset.label + ": " + string;
            };

            // safety catch in case there is no data.
            if (
                typeof data === "undefined" ||
                0 === data.length ||
                (typeof data === "object" && typeof data.labels === "object" && 0 === data.labels.length)
            ) {
                let el = document.getElementById(holder).parentElement;
                el.innerHTML = "";
                el.classList.add("general-chart-error");
                el.innerText = i18next.t("firefly.no_data_for_chart");
                return;
            }

            if (colorData) {
                data = colorizeAllData(data, "line");
            }

            // add a marker to the chart if defined.
            if (drawTodayMarker && "" !== drawTodayLabel) {
                let locale = window.store.get("locale");
                let language = window.store.get("language");
                let markDate = format(
                    new Date(drawTodayLabel),
                    i18next.t("config.month_and_day_fns", { lng: locale }),
                    locale,
                );
                let today = i18next.t("firefly.today", { lng: language });
                let xAdjust = 0;
                if (drawTodayIndex < 3) {
                    xAdjust = today.length * 4;
                }
                if (drawTodayIndex > 26) {
                    xAdjust = today.length * -4;
                }
                // draw line using annotation plugin.
                options.plugins.annotation = {
                    annotations: {
                        line1: {
                            type: "line",
                            xScaleID: "x",
                            yScaleID: firstScale,
                            xMin: markDate,
                            xMax: markDate,
                            display: true,
                            borderColor: chartTheme().muted,
                            borderWidth: 1,
                            borderDash: [4, 4],
                            label: {
                                xAdjust: xAdjust,
                                content: today,
                                enabled: true,
                                display: true,
                                position: "start",
                                backgroundColor: chartTheme().foreground,
                                color: chartTheme().card,
                                borderRadius: 999,
                                padding: { x: 8, y: 3 },
                                font: { size: 11, weight: "600" },
                            },
                        },
                    },
                };
            }
            newChart(holder, {
                type: "line",
                data: data,
                options: options,
            });
        })
        .catch((error) => {
            console.error(error);
            let el = document.getElementById(holder).parentElement;
            el.innerHTML = "";
            el.classList.add("general-chart-error");
            el.innerText = i18next.t("firefly.could_not_load_chart") + " " + error;
        });
}

function drawSingleCurrencyLineChart(url, holder, anonymous) {
    document.getElementById(holder).classList.remove("general-chart-error");
    window.axios
        .get(url)
        .then((response) => {
            let all = response.data;
            let data = all.data;
            let currency = all.currency;

            let yAxisCallback = function (value) {
                if (anonymous) {
                    value = "0";
                }
                return formatMoney(value, currency.code);
            };
            let labelCallback = function (tooltipItem) {
                "use strict";
                let index = tooltipItem.dataIndex;
                let amount = tooltipItem.dataset.data[index];
                let label = tooltipItem.label;
                let string = formatMoney(amount, currency.code);
                if (anonymous) {
                    string = formatMoney("0", currency.code);
                }
                return label + ": " + string;
            };

            let options = { ...defaultChartOptions };
            options.scales.y.ticks.callback = yAxisCallback;
            options.plugins.tooltip.callbacks.label = labelCallback;

            if (
                typeof data === "undefined" ||
                0 === data.length ||
                (typeof data === "object" && typeof data.labels === "object" && 0 === data.labels.length)
            ) {
                let el = document.getElementById(holder).parentElement;
                el.innerHTML = "";
                el.classList.add("general-chart-error");
                el.innerText = i18next.t("firefly.no_data_for_chart");
                return;
            }

            if (Array.isArray(data.datasets)) {
                data = colorizeAllData(data, "line");
            }

            newChart(holder, {
                type: "line",
                data: data,
                options: options,
            });
        })
        .catch((error) => {
            let el = document.getElementById(holder).parentElement;
            el.innerHTML = "";
            el.classList.add("general-chart-error");
            el.innerText = i18next.t("firefly.could_not_load_chart") + " " + error;
        });
}

function colorizeAllData(data, type) {
    const theme = chartTheme();
    const count = data.datasets.length;
    for (let i in data.datasets) {
        if (Object.hasOwn(data.datasets, i)) {
            const dataset = data.datasets[i];
            const label = String(dataset.label ?? "");
            let color = theme.palette[i % theme.palette.length];
            let fillColor = color;

            // budget overview: spent is solid, what is left is a pale version of
            // the same color and overspending stands out in the expense color.
            if (label.startsWith("budgeted") || label.startsWith("spent")) {
                color = theme.palette[0];
                fillColor = color;
            }
            if (label.startsWith("left")) {
                color = theme.palette[0];
                fillColor = withAlpha(color, 0.22);
            }
            if (label.startsWith("overspent")) {
                color = theme.expense;
                fillColor = color;
            }

            dataset.borderColor = color;
            dataset.pointBackgroundColor = color;
            dataset.pointHoverBackgroundColor = color;
            dataset.pointHoverBorderColor = theme.card;
            if ("line" === type) {
                dataset.backgroundColor = verticalGradient(color);
                dataset.fill = count <= 3 ? "origin" : false;
                continue;
            }
            dataset.backgroundColor = fillColor;
            dataset.borderWidth = 0;
        }
    }
    return data;
}

// https://stackoverflow.com/questions/43855166/how-to-tell-if-two-dates-are-in-the-same-day-or-in-the-same-hour
function isSameDay(d1, d2) {
    return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
}

function formatLabel(str, maxWidth) {
    let sections = [];
    str = String(str);
    let words = str.split(" ");
    let temp = "";

    words.forEach(function (item, index) {
        if (temp.length > 0) {
            let concat = temp + " " + item;

            if (concat.length > maxWidth) {
                sections.push(temp);
                temp = "";
            } else {
                if (index === words.length - 1) {
                    sections.push(concat);
                    return;
                } else {
                    temp = concat;
                    return;
                }
            }
        }

        if (index === words.length - 1) {
            sections.push(item);
            return;
        }

        if (item.length < maxWidth) {
            temp = item;
        } else {
            sections.push(item);
        }
    });

    return sections;
}

function currentLocale() {
    return String(window.__localeId__ ?? "en_US").replace("_", "-");
}

/**
 * Formats an amount with a currency symbol (some chart endpoints only return the symbol).
 */
function formatWithSymbol(amount, symbol, anonymous) {
    const value = anonymous ? 0 : amount;
    const number = new Intl.NumberFormat(currentLocale(), {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
    return ("" === String(symbol ?? "") ? "" : symbol + " ") + number;
}

function showNoData(holder) {
    const el = document.getElementById(holder);
    if (null === el) {
        return;
    }
    const parent = el.parentElement;
    parent.innerHTML = "";
    parent.classList.add("ff-chart-empty");
    parent.innerText = i18next.t("firefly.no_data_for_chart");
}

/**
 * Doughnut chart with a total in the middle and an HTML legend (name, amount, share).
 * Reads data in the "multiSet" format used by the chart/category/frontpage endpoint.
 * Everything after the five largest slices is grouped as "other".
 */
export function drawCategoryDonut(url, holder, settings) {
    window.axios
        .get(url)
        .then((response) => {
            const data = response.data;
            if (
                null === data ||
                typeof data !== "object" ||
                !Array.isArray(data.datasets) ||
                0 === data.datasets.length ||
                !Array.isArray(data.labels)
            ) {
                showNoData(holder);
                return;
            }
            const dataset = data.datasets[0];
            const symbol = dataset.currency_symbol ?? "";
            let items = data.labels
                .map((label, index) => ({
                    label: String(label),
                    value: Math.abs(parseFloat(dataset.data[index]) || 0),
                }))
                .filter((item) => item.value > 0)
                .sort((a, b) => b.value - a.value);
            if (0 === items.length) {
                showNoData(holder);
                return;
            }
            if (items.length > 6) {
                const rest = items.slice(5).reduce((sum, item) => sum + item.value, 0);
                items = items.slice(0, 5).concat([{ label: settings.otherLabel, value: rest }]);
            }
            const total = items.reduce((sum, item) => sum + item.value, 0);
            const theme = chartTheme();
            const colors = items.map((item, index) => theme.palette[index % theme.palette.length]);

            newChart(holder, {
                type: "doughnut",
                data: {
                    labels: items.map((item) => item.label),
                    datasets: [
                        {
                            data: items.map((item) => item.value),
                            backgroundColor: colors,
                            hoverOffset: 4,
                            borderRadius: 4,
                            spacing: 2,
                            borderWidth: 0,
                        },
                    ],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: "74%",
                    interaction: { mode: "nearest", intersect: true },
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: (context) =>
                                    " " +
                                    context.label +
                                    ": " +
                                    formatWithSymbol(context.parsed, symbol, settings.anonymous),
                            },
                        },
                    },
                },
            });

            const totalHolder = document.getElementById(settings.total);
            if (null !== totalHolder) {
                totalHolder.textContent = formatWithSymbol(total, symbol, settings.anonymous);
            }
            const legend = document.getElementById(settings.legend);
            if (null === legend) {
                return;
            }
            legend.innerHTML = "";
            items.forEach((item, index) => {
                const row = document.createElement("li");
                const dot = document.createElement("span");
                dot.className = "ff-legend-dot ff-legend-dot-" + (index % theme.palette.length);
                const name = document.createElement("span");
                name.className = "ff-legend-name";
                name.textContent = item.label;
                const amount = document.createElement("span");
                amount.className = "ff-legend-value";
                amount.textContent = formatWithSymbol(item.value, symbol, settings.anonymous);
                const share = document.createElement("span");
                share.className = "ff-legend-share";
                share.textContent = Math.round((item.value / total) * 100) + "%";
                row.append(dot, name, amount, share);
                legend.appendChild(row);
            });
        })
        .catch((error) => {
            console.error(error);
            showNoData(holder);
        });
}

/**
 * Grouped bars with income and expenses per month (api/v1/chart/balance/balance).
 */
export function drawIncomeExpenseChart(url, holder, settings) {
    window.axios
        .get(url)
        .then((response) => {
            const all = response.data;
            if (!Array.isArray(all) || 0 === all.length) {
                showNoData(holder);
                return;
            }
            // use the first currency that has data.
            const earned = all.find((set) => "earned" === set.label);
            const spent = all.find((set) => "spent" === set.label && set.currency_id === earned?.currency_id);
            if (typeof earned === "undefined" || typeof spent === "undefined") {
                showNoData(holder);
                return;
            }
            const usePrimary =
                window.store.get("convert_to_primary") && earned.currency_code !== earned.primary_currency_code;
            const key = usePrimary ? "pc_entries" : "entries";
            const currencyCode = usePrimary ? earned.primary_currency_code : earned.currency_code;
            const dates = Object.keys(earned[key]);
            const monthFormat = new Intl.DateTimeFormat(currentLocale(), { month: "short" });
            const theme = chartTheme();

            const options = structuredClone(defaultChartOptions);
            options.scales.x.ticks = { maxRotation: 0 };
            options.scales.y.ticks.callback = (value) => formatMoney(settings.anonymous ? 0 : value, currencyCode);
            options.plugins.tooltip.callbacks.label = (context) =>
                " " +
                context.dataset.label +
                ": " +
                formatMoney(settings.anonymous ? 0 : context.parsed.y, currencyCode);

            newChart(holder, {
                type: "bar",
                data: {
                    labels: dates.map((date) => monthFormat.format(new Date(date))),
                    datasets: [
                        {
                            label: settings.earnedLabel,
                            data: dates.map((date) => Math.abs(parseFloat(earned[key][date]) || 0)),
                            backgroundColor: theme.income,
                            borderWidth: 0,
                        },
                        {
                            label: settings.spentLabel,
                            data: dates.map((date) => Math.abs(parseFloat(spent[key][date]) || 0)),
                            backgroundColor: theme.expense,
                            borderWidth: 0,
                        },
                    ],
                },
                options: options,
            });
        })
        .catch((error) => {
            console.error(error);
            showNoData(holder);
        });
}
