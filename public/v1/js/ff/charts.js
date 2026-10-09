/*
 * charts.js
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
var allCharts = {};


/*
 Make some colours:
 */
var colourSet = [
    [43, 127, 166], // chart-1, blue
    [52, 179, 160], // chart-2, teal
    [242, 163, 58], // chart-3, amber
    [139, 124, 246], // chart-4, violet
    [240, 106, 127], // chart-5, rose
    [161, 161, 170], // chart-6, zinc
    [53, 124, 165],
    [0, 141, 76], // green
    [219, 139, 11],
    [202, 25, 90], // paars rood-ish #CA195A
    [85, 82, 153],
    [66, 133, 244],
    [219, 68, 55], // red #DB4437
    [244, 180, 0],
    [15, 157, 88],
    [171, 71, 188],
    [0, 172, 193],
    [255, 112, 67],
    [158, 157, 36],
    [92, 107, 192],
    [240, 98, 146],
    [0, 121, 107],
    [194, 24, 91]
];

var fillColors = [];

for (var i = 0; i < colourSet.length; i++) {
    fillColors.push("rgba(" + colourSet[i][0] + ", " + colourSet[i][1] + ", " + colourSet[i][2] + ", 0.5)");
}

/*
 Look & feel that matches the theme tokens (sass/theme/_tokens.scss):
 smooth lines, no points until hover, rounded bars, dashed grid and a card-like tooltip.
 This is Chart.js 4 (v1/js/lib/chart.umd.min.js).
 */
function themeColor(name, fallback) {
    var value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return '' === value ? fallback : value;
}

(function () {
    "use strict";
    var muted = themeColor('--ff-muted-foreground', '#71717a');
    var border = themeColor('--ff-border', '#e4e4e7');
    var foreground = themeColor('--ff-foreground', '#09090b');
    var popover = themeColor('--ff-popover', '#ffffff');
    var card = themeColor('--ff-card', '#ffffff');
    var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    Chart.defaults.responsive = true;
    Chart.defaults.maintainAspectRatio = false;
    Chart.defaults.font.family = getComputedStyle(document.body).fontFamily;
    Chart.defaults.font.size = 12;
    Chart.defaults.color = muted;
    Chart.defaults.borderColor = border;
    Chart.defaults.animation.duration = reducedMotion ? 0 : 400;
    Chart.defaults.animation.easing = 'easeOutQuart';
    Chart.defaults.interaction.mode = 'index';
    Chart.defaults.interaction.intersect = false;

    Chart.defaults.elements.line.tension = 0.4;
    Chart.defaults.elements.line.borderWidth = 2.5;
    Chart.defaults.elements.line.borderCapStyle = 'round';
    Chart.defaults.elements.line.borderJoinStyle = 'round';
    Chart.defaults.elements.point.radius = 0;
    Chart.defaults.elements.point.hoverRadius = 5;
    Chart.defaults.elements.point.hitRadius = 8;
    Chart.defaults.elements.point.hoverBorderWidth = 2;
    Chart.defaults.elements.bar.borderRadius = 5;
    Chart.defaults.elements.bar.borderSkipped = 'start';
    Chart.defaults.elements.bar.borderWidth = 0;
    Chart.defaults.elements.arc.borderWidth = 2;
    Chart.defaults.elements.arc.borderColor = card;
    Chart.defaults.elements.arc.borderRadius = 4;
    Chart.defaults.datasets.bar.maxBarThickness = 32;
    Chart.defaults.datasets.bar.categoryPercentage = 0.7;
    Chart.defaults.datasets.bar.barPercentage = 0.8;

    Chart.defaults.plugins.legend.display = false;
    Chart.defaults.plugins.legend.labels.usePointStyle = true;
    Chart.defaults.plugins.legend.labels.pointStyle = 'circle';
    Chart.defaults.plugins.legend.labels.boxWidth = 8;
    Chart.defaults.plugins.legend.labels.boxHeight = 8;

    var tooltip = Chart.defaults.plugins.tooltip;
    tooltip.backgroundColor = popover;
    tooltip.titleColor = foreground;
    tooltip.bodyColor = foreground;
    tooltip.footerColor = muted;
    tooltip.borderColor = border;
    tooltip.borderWidth = 1;
    tooltip.padding = 10;
    tooltip.cornerRadius = 8;
    tooltip.caretSize = 0;
    tooltip.caretPadding = 8;
    tooltip.boxWidth = 8;
    tooltip.boxHeight = 8;
    tooltip.boxPadding = 6;
    tooltip.usePointStyle = true;
    tooltip.titleFont = {weight: '600', size: 12};
    tooltip.bodyFont = {size: 12};
    tooltip.titleMarginBottom = 6;

    Chart.defaults.scale.grid.color = border;
    Chart.defaults.scale.ticks.padding = 8;
})();

/**
 * Vertical gradient below a line, from the series color to transparent.
 */
function lineGradient(colour) {
    "use strict";
    return function (context) {
        var area = context.chart.chartArea;
        if (!area) {
            return "rgba(" + colour[0] + ", " + colour[1] + ", " + colour[2] + ", 0.12)";
        }
        var gradient = context.chart.ctx.createLinearGradient(0, area.top, 0, area.bottom);
        gradient.addColorStop(0, "rgba(" + colour[0] + ", " + colour[1] + ", " + colour[2] + ", 0.28)");
        gradient.addColorStop(1, "rgba(" + colour[0] + ", " + colour[1] + ", " + colour[2] + ", 0)");
        return gradient;
    };
}

/**
 *
 * @param data
 * @param chartType
 * @returns {{}}
 */
function colorizeData(data, chartType) {
    var newData = {};
    newData.datasets = [];
    var card = themeColor('--ff-card', '#ffffff');

    for (var loop = 0; loop < data.count; loop++) {
        newData.labels = data.labels;
        var dataset = data.datasets[loop];
        var colour = colourSet[loop % colourSet.length];
        var solid = "rgb(" + colour[0] + ", " + colour[1] + ", " + colour[2] + ")";
        var type = dataset.type || chartType;
        dataset.borderColor = solid;
        dataset.pointBackgroundColor = solid;
        dataset.pointHoverBackgroundColor = solid;
        dataset.pointHoverBorderColor = card;
        dataset.backgroundColor = solid;
        dataset.fill = false;

        // line charts with only a few lines get a soft gradient below the line.
        if ('line' === type && data.count <= 3) {
            dataset.backgroundColor = lineGradient(colour);
            dataset.fill = 'origin';
        }
        newData.datasets.push(dataset);
    }
    return newData;
}

/**
 * Money axis with optional currency symbol.
 */
function moneyAxis(extra, currencySymbol) {
    "use strict";
    return $.extend(true, {
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
                if (anonymous) {
                    return accounting.formatMoney(0);
                }
                return accounting.formatMoney(tickValue, currencySymbol);
            }
        }
    }, extra);
}

/**
 * Function to draw a line chart:
 * @param URL
 * @param container
 */
function lineChart(URL, container) {
    "use strict";

    var colorData = true;
    var options = $.extend(true, {}, defaultChartOptions);
    var chartType = 'line';

    drawAChart(URL, container, chartType, options, colorData);
}

/**
 * Function to draw a line chart that doesn't start at ZERO.
 * @param URL
 * @param container
 */
function lineNoStartZeroChart(URL, container) {
    "use strict";

    var colorData = true;
    var options = $.extend(true, {}, defaultChartOptions);
    var chartType = 'line';
    options.scales.y.beginAtZero = false;

    drawAChart(URL, container, chartType, options, colorData);
}

/**
 * Function to draw a line chart with another currency than the default one.
 *
 * @param URL
 * @param container
 * @param currencySymbol
 */
function otherCurrencyLineChart(URL, container, currencySymbol) {
    "use strict";

    var colorData = true;
    var options = $.extend(true, {}, defaultChartOptions);
    options.scales.y = moneyAxis({}, currencySymbol);
    var chartType = 'line';

    drawAChart(URL, container, chartType, options, colorData);
}

/**
 * Function to draw a chart with double Y Axes and stacked columns.
 *
 * @param URL
 * @param container
 */
function doubleYChart(URL, container) {
    "use strict";

    var colorData = true;
    var options = $.extend(true, {}, defaultChartOptions);
    delete options.scales.y;
    options.scales['y-axis-0'] = moneyAxis({position: 'left', stacked: true});
    options.scales['y-axis-1'] = moneyAxis({position: 'right', stacked: true, grid: {display: false}});
    options.scales.x.stacked = true;

    var chartType = 'bar';

    drawAChart(URL, container, chartType, options, colorData);
}

/**
 * Function to draw a chart with double Y Axes and non stacked columns.
 *
 * @param URL
 * @param container
 */
function doubleYNonStackedChart(URL, container) {
    "use strict";

    var colorData = true;
    var options = $.extend(true, {}, defaultChartOptions);
    delete options.scales.y;
    options.scales['y-axis-0'] = moneyAxis({position: 'left'});
    options.scales['y-axis-1'] = moneyAxis({position: 'right', grid: {display: false}});
    var chartType = 'bar';

    drawAChart(URL, container, chartType, options, colorData);
}


/**
 *
 * @param URL
 * @param container
 */
function columnChart(URL, container) {
    "use strict";
    var colorData = true;
    var options = $.extend(true, {}, defaultChartOptions);
    var chartType = 'bar';

    drawAChart(URL, container, chartType, options, colorData);
}


/**
 *
 * @param URL
 * @param container
 */
function columnChartCustomColours(URL, container) {
    "use strict";
    var colorData = false;
    var options = $.extend(true, {}, defaultChartOptions);
    var chartType = 'bar';

    drawAChart(URL, container, chartType, options, colorData);

}

/**
 *
 * @param URL
 * @param container
 */
function stackedColumnChart(URL, container) {
    "use strict";

    var colorData = true;
    var options = $.extend(true, {}, defaultChartOptions);

    options.scales.x.stacked = true;
    options.scales.y.stacked = true;

    var chartType = 'bar';

    drawAChart(URL, container, chartType, options, colorData);
}

/**
 *
 * @param URL
 * @param container
 */
function pieChart(URL, container) {
    "use strict";

    var colorData = false;
    var options = $.extend(true, {}, defaultPieOptions);
    var chartType = 'doughnut';

    drawAChart(URL, container, chartType, options, colorData);

}

/**
 *
 * @param URL
 * @param container
 */
function multiCurrencyPieChart(URL, container) {
    "use strict";

    var colorData = false;
    var options = $.extend(true, {}, pieOptionsWithCurrency);
    var chartType = 'doughnut';

    drawAChart(URL, container, chartType, options, colorData);

}

/**
 * Line marking "today" (chartjs-plugin-annotation 3).
 */
function todayAnnotation() {
    "use strict";
    if (typeof drawVerticalLine === 'undefined' || '' === drawVerticalLine || !Chart.registry.plugins.get('annotation')) {
        return null;
    }
    return {
        annotations: {
            today: {
                type: 'line',
                scaleID: 'x',
                value: drawVerticalLine,
                borderColor: themeColor('--ff-muted-foreground', '#71717a'),
                borderWidth: 1,
                borderDash: [4, 4],
                label: {
                    display: true,
                    content: typeof todayText === 'undefined' ? '' : todayText.trim(),
                    position: 'start',
                    backgroundColor: themeColor('--ff-foreground', '#09090b'),
                    color: themeColor('--ff-card', '#ffffff'),
                    borderRadius: 999,
                    padding: {x: 8, y: 3},
                    font: {size: 11, weight: '600'}
                }
            }
        }
    };
}

/**
 * @param URL
 * @param container
 * @param chartType
 * @param options
 * @param colorData
 */
function drawAChart(URL, container, chartType, options, colorData) {
    var containerObj = document.getElementById(container);
    if (null === containerObj) {
        return;
    }
    if (containerObj.length === 0) {
        return;
    }
    window.axios.get(URL).then(function (response) {
        containerObj.classList.remove('general-chart-error');
        var data = response.data;
        if (
            typeof data === 'undefined' ||
            0 === data.length ||
            (typeof data === 'object' && typeof data.labels === 'object' && 0 === data.labels.length)
        ) {
            var holder = document.getElementById(container).parentNode.parentNode;
            if (holder.classList.contains('card') || holder.classList.contains('card-body')) {
                var boxBody;
                if (!holder.classList.contains('card-body')) {
                    boxBody = holder.querySelector('.card-body');
                } else {
                    boxBody = holder;
                }
                boxBody.innerHTML = '<p class="text-muted mb-0"><em>' + noDataForChart + '</em></p>';
            }
            return;
        }

        if (colorData) {
            data = colorizeData(data, chartType);
        }

        if (allCharts.hasOwnProperty(container)) {
            allCharts[container].data.datasets = data.datasets;
            allCharts[container].data.labels = data.labels;
            allCharts[container].update();
        } else {
            var ctx = document.getElementById(container).getContext("2d");
            // charts in a fixed-height container fill it instead of keeping their aspect ratio.
            if (containerObj.parentElement.classList.contains('ff-chart')) {
                options.maintainAspectRatio = false;
            }
            var annotation = todayAnnotation();
            if (null !== annotation) {
                options.plugins = options.plugins || {};
                options.plugins.annotation = annotation;
            }
            allCharts[container] = new Chart(ctx, {
                type: chartType,
                data: data,
                options: options
            });
        }

    }).catch(function (reason) {
        console.error(reason);
        document.getElementById(container).classList.add('general-chart-error');
    });
}
