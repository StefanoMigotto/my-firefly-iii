/*
 * charts.defaults.js
 * Copyright (c) 2019 james@firefly-iii.org
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

/**
 * Takes a string phrase and breaks it into separate phrases no bigger than 'maxwidth', breaks are made at complete words.
 * https://stackoverflow.com/questions/21409717/chart-js-and-long-labels
 *
 * @param str
 * @param maxwidth
 * @returns {Array}
 */
function formatLabel(str, maxwidth) {
    var sections = [];
    str = String(str);
    var words = str.split(" ");
    var temp = "";

    words.forEach(function (item, index) {
        if (temp.length > 0) {
            var concat = temp + ' ' + item;

            if (concat.length > maxwidth) {
                sections.push(temp);
                temp = "";
            } else {
                if (index === (words.length - 1)) {
                    sections.push(concat);
                    return;
                } else {
                    temp = concat;
                    return;
                }
            }
        }

        if (index === (words.length - 1)) {
            sections.push(item);
            return;
        }

        if (item.length < maxwidth) {
            temp = item;
        } else {
            sections.push(item);
        }

    });

    return sections;
}

/*
 Options use the Chart.js 4 format. The look & feel (colors, grid, tooltip)
 is set globally in charts.js.
 */
var defaultChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    elements: {
        line: {
            cubicInterpolationMode: 'monotone'
        }
    },
    scales: {
        x: {
            grid: {
                display: false
            },
            border: {
                display: false
            },
            ticks: {
                // break ticks when too long.
                callback: function (value) {
                    return formatLabel(this.getLabelForValue(value), 20);
                }
            }
        },
        y: {
            display: true,
            beginAtZero: true,
            grid: {
                drawTicks: false
            },
            border: {
                display: false,
                dash: [3, 3]
            },
            ticks: {
                maxTicksLimit: 5,
                padding: 8,
                callback: function (tickValue) {
                    "use strict";
                    if (anonymous) {
                        return accounting.formatMoney(0);
                    }
                    // use first symbol or null:
                    return accounting.formatMoney(tickValue);
                }
            }
        }
    },
    plugins: {
        tooltip: {
            callbacks: {
                label: function (context) {
                    "use strict";
                    var string = accounting.formatMoney(context.parsed.y, context.dataset.currency_symbol);
                    if (anonymous) {
                        string = accounting.formatMoney(0);
                    }
                    return ' ' + context.dataset.label + ': ' + string;
                }
            }
        }
    }
};

var pieOptionsWithCurrency = {
    cutout: '68%',
    interaction: {
        mode: 'nearest',
        intersect: true
    },
    plugins: {
        tooltip: {
            callbacks: {
                label: function (context) {
                    "use strict";
                    var value = context.dataset.data[context.dataIndex];
                    var string = accounting.formatMoney(value, context.dataset.currency_symbol[context.dataIndex]);
                    if (anonymous) {
                        string = accounting.formatMoney(0);
                    }
                    return ' ' + context.label + ': ' + string;
                }
            }
        }
    },
    maintainAspectRatio: true,
    responsive: true
};

var defaultPieOptions = {
    cutout: '68%',
    interaction: {
        mode: 'nearest',
        intersect: true
    },
    plugins: {
        tooltip: {
            callbacks: {
                label: function (context) {
                    "use strict";
                    var value = context.dataset.data[context.dataIndex];
                    var string = accounting.formatMoney(value);
                    if (anonymous) {
                        string = accounting.formatMoney(0);
                    }
                    return ' ' + context.label + ': ' + string;
                }
            }
        }
    },
    maintainAspectRatio: true,
    responsive: true
};

var neutralDefaultPieOptions = {
    cutout: '68%',
    interaction: {
        mode: 'nearest',
        intersect: true
    },
    plugins: {
        tooltip: {
            callbacks: {
                label: function (context) {
                    "use strict";
                    var value = context.dataset.data[context.dataIndex];
                    var string = accounting.formatMoney(value, '¤');
                    if (anonymous) {
                        string = accounting.formatMoney(0);
                    }
                    return ' ' + context.label + ': ' + string;
                }
            }
        }
    },
    maintainAspectRatio: true,
    responsive: true
};
