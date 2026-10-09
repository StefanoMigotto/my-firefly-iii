<div class="row mb-1" x-data="boxes" id="box_out_holder">
    <!--begin::KPI 1: in and out -->
    <div class="col-6 col-xl-3">
        <div class="card ff-kpi">
            <div class="card-body">
                <div class="ff-kpi-header">
                    <a class="ff-kpi-title" href="{{ route('reports.report.default', ['allAssetAccounts', $start->format('Ymd'), $end->format('Ymd')]) }}">{{ __('firefly.in_out_period') }}</a>
                    <span class="ff-kpi-icon ff-kpi-icon-4"><em class="bi bi-arrow-down-up"></em></span>
                </div>
                <div class="ff-kpi-value">
                    <template x-if="loading">
                        <span class="placeholder-glow"><span class="placeholder col-8"></span></span>
                    </template>
                    <template x-for="(amount, index) in balanceBox.amounts" :key="index">
                        <span>
                            <span x-text="amount"></span><span
                                :class="{ 'd-none': (balanceBox.amounts.length == index+1) }">, </span>
                        </span>
                    </template>
                </div>
                <div class="ff-kpi-note">
                    <template x-if="0 === balanceBox.subtitles.length">
                        <span>&nbsp;</span>
                    </template>
                    <template x-for="(subtitle, index) in balanceBox.subtitles" :key="index">
                        <span>
                            <span x-text="subtitle"></span><span
                                :class="{ 'd-none': (balanceBox.subtitles.length == index+1) }"> &amp; </span>
                        </span>
                    </template>
                </div>
            </div>
        </div>
    </div>
    <!--end::KPI 1-->
    <!--begin::KPI 2: subscriptions -->
    <div class="col-6 col-xl-3">
        <div class="card ff-kpi">
            <div class="card-body">
                <div class="ff-kpi-header">
                    <a class="ff-kpi-title" href="{{ route('subscriptions.index') }}">{{ __('firefly.bills_to_pay') }}</a>
                    <span class="ff-kpi-icon ff-kpi-icon-1"><em class="bi bi-calendar-check"></em></span>
                </div>
                <div class="ff-kpi-value">
                    <template x-if="loading">
                        <span class="placeholder-glow"><span class="placeholder col-8"></span></span>
                    </template>
                    <template x-if="!loading && 0 === billBox.unpaid.length">
                        <span>&mdash;</span>
                    </template>
                    <template x-for="(amount, index) in billBox.unpaid" :key="index">
                        <span>
                            <span x-text="amount"></span><span
                                :class="{ 'd-none': (billBox.unpaid.length == index+1) }">, </span>
                        </span>
                    </template>
                </div>
                <div class="ff-kpi-note">
                    <template x-if="0 === billBox.paid.length && !loading">
                        <span>{{ __('firefly.no_waiting') }}</span>
                    </template>
                    <template x-if="billBox.paid.length > 0">
                        <span>
                            {{ __('firefly.paid') }}:
                            <template x-for="(amount, index) in billBox.paid" :key="index">
                                <span>
                                    <span x-text="amount"></span><span
                                        :class="{ 'd-none': (billBox.paid.length == index+1) }">, </span>
                                </span>
                            </template>
                        </span>
                    </template>
                </div>
            </div>
        </div>
    </div>
    <!--end::KPI 2-->
    <!--begin::KPI 3: left to spend -->
    <div class="col-6 col-xl-3">
        <div class="card ff-kpi">
            <div class="card-body">
                <div class="ff-kpi-header">
                    <a class="ff-kpi-title" href="{{ route('budgets.index') }}">{{ __('firefly.left_to_spend') }}</a>
                    <span x-bind:class="{'ff-kpi-icon': true, 'ff-kpi-icon-2': !noMoneyLeft, 'ff-kpi-icon-negative': noMoneyLeft}"><em class="bi bi-wallet2"></em></span>
                </div>
                <div x-bind:class="{'ff-kpi-value': true, 'money-negative': noMoneyLeft}">
                    <template x-if="loading">
                        <span class="placeholder-glow"><span class="placeholder col-8"></span></span>
                    </template>
                    <template x-if="!loading && 0 === leftBox.left.length">
                        <span>&mdash;</span>
                    </template>
                    <template x-for="(amount, index) in leftBox.left" :key="index">
                        <span>
                            <span x-text="amount"></span><span
                                :class="{ 'd-none': (leftBox.left.length == index+1) }">, </span>
                        </span>
                    </template>
                </div>
                <div class="ff-kpi-note">
                    <template x-if="!loading && 0 === leftBox.left.length">
                        <span>{{ __('firefly.box_no_budgeted') }}</span>
                    </template>
                    <template x-if="0 !== leftBox.perDay.length">
                        <span>{{ __('firefly.per_day') }}:</span>
                    </template>
                    <template x-for="(amount, index) in leftBox.perDay" :key="index">
                        <span>
                            <span x-text="amount"></span><span
                                :class="{ 'd-none': (leftBox.perDay.length == index+1) }">, </span>
                        </span>
                    </template>
                </div>
            </div>
        </div>
    </div>
    <!--end::KPI 3-->
    <!--begin::KPI 4: net worth -->
    <div class="col-6 col-xl-3">
        <div class="card ff-kpi">
            <div class="card-body">
                <div class="ff-kpi-header">
                    <a class="ff-kpi-title" href="{{ route('reports.report.default', ['allAssetAccounts','currentYearStart','currentYearEnd']) }}">{{ __('firefly.net_worth') }}</a>
                    <span class="ff-kpi-icon ff-kpi-icon-5"><em class="bi bi-graph-up-arrow"></em></span>
                </div>
                <div class="ff-kpi-value">
                    <template x-if="loading">
                        <span class="placeholder-glow"><span class="placeholder col-8"></span></span>
                    </template>
                    <template x-for="(amount, index) in netBox.net" :key="index">
                        <span>
                            <span x-text="amount"></span><span
                                :class="{ 'd-none': (netBox.net.length == index+1) }">, </span>
                        </span>
                    </template>
                </div>
                <div class="ff-kpi-note">
                    <a href="{{ route('accounts.index', ['asset']) }}">{{ __('firefly.yourAccounts') }}</a>
                </div>
            </div>
        </div>
    </div>
    <!--end::KPI 4-->
</div>
