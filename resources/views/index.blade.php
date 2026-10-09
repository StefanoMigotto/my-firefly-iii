@extends('layout.v3.session')
@section('content')
    <!-- TODO internals modal voor pagina settings -->
    <!-- TODO wizard modal voor weet ik veel -->
    <x-dashboard.boxes :start="$start" :end="$end"/>

    {{-- translated labels for the dashboard widgets that are drawn in JavaScript --}}
    <span id="dashboard-labels" class="d-none"
          data-other="{{ __('firefly.others') }}"
          data-earned="{{ __('firefly.earned') }}"
          data-spent="{{ __('firefly.spent') }}"
          data-left="{{ __('firefly.left') }}"
          data-overspent="{{ __('firefly.overspent') }}"
          data-no-budgets="{{ __('firefly.box_no_budgeted') }}"></span>

    <div x-data="index">
        <div class="row">
            <div class="col-xl-8">
                <!--ACCOUNTS -->
                <div class="card ff-dashboard-card">
                    <div class="card-header">
                        <div>
                            <h3 class="card-title"><a href="{{ route('accounts.index',['asset']) }}"
                                                      title="{{ __('firefly.yourAccounts') }}">{{ __('firefly.yourAccounts') }}</a></h3>
                            <p class="card-description">{{ __('firefly.accountBalances') }}</p>
                        </div>
                        <div class="card-tools d-print-none">
                            <a href="{{ route('accounts.index',['asset']) }}" class="btn btn-outline-secondary btn-sm">
                                {{ __('firefly.go_to_asset_accounts') }} <span class="bi bi-chevron-right"></span>
                            </a>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="ff-chart ff-chart-lg">
                            <canvas id="accounts-chart"></canvas>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-xl-4">
                <!--CATEGORIES -->
                <div class="card ff-dashboard-card">
                    <div class="card-header">
                        <div>
                            <h3 class="card-title"><a href="{{ route('categories.index') }}"
                                                      title="{{ __('firefly.categories') }}">{{ __('firefly.expenses_by_category') }}</a></h3>
                            <p class="card-description">{{ $start->isoFormat($monthAndDayFormat) }} – {{ $end->isoFormat($monthAndDayFormat) }}</p>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="ff-chart ff-chart-donut">
                            <canvas id="categories-chart"></canvas>
                            <div class="ff-donut-center">
                                <span class="ff-donut-total" id="categories-total">&nbsp;</span>
                                <span class="ff-donut-caption">{{ __('firefly.spent') }}</span>
                            </div>
                        </div>
                        <ul class="ff-legend" id="categories-legend"></ul>
                    </div>
                </div>
            </div>
        </div>

        <div class="row">
            <div class="col-xl-6">
                <!--INCOME AND EXPENSES -->
                <div class="card ff-dashboard-card">
                    <div class="card-header">
                        <div>
                            <h3 class="card-title"><a href="{{ route('reports.report.default', ['allAssetAccounts', $start->format('Ymd'), $end->format('Ymd')]) }}">{{ __('firefly.income_and_expenses') }}</a></h3>
                            <p class="card-description">{{ __('firefly.in_out_period') }}</p>
                        </div>
                        <div class="card-tools ff-legend-inline">
                            <span><span class="ff-legend-dot ff-legend-dot-income"></span>{{ __('firefly.earned') }}</span>
                            <span><span class="ff-legend-dot ff-legend-dot-expense"></span>{{ __('firefly.spent') }}</span>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="ff-chart ff-chart-md">
                            <canvas id="income-expense-chart"></canvas>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-xl-6">
                <!--BUDGETS -->
                <div class="card ff-dashboard-card">
                    <div class="card-header">
                        <div>
                            <h3 class="card-title"><a href="{{ route('budgets.index') }}"
                                                      title="{{ __('firefly.budgetsAndSpending') }}">{{ __('firefly.budgetsAndSpending') }}</a></h3>
                            <p class="card-description">{{ $start->isoFormat($monthAndDayFormat) }} – {{ $end->isoFormat($monthAndDayFormat) }}</p>
                        </div>
                        <div class="card-tools d-print-none">
                            <a href="{{ route('budgets.index') }}" class="btn btn-outline-secondary btn-sm">
                                {{ __('firefly.go_to_budgets') }} <span class="bi bi-chevron-right"></span>
                            </a>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="ff-budget-list" id="budget-list">
                            <div class="placeholder-glow">
                                <span class="placeholder col-12 mb-3"></span>
                                <span class="placeholder col-10 mb-3"></span>
                                <span class="placeholder col-11"></span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="row">
            <div class="col-xl-8" id="all_transactions">
                <!--TRANSACTIONS -->
                <div class="row">
                    @foreach($transactions as $data)
                        <div class="col-md-6">
                            <div class="card ff-dashboard-card">
                                <div class="card-header">
                                    <div>
                                        <h3 class="card-title"><a
                                                href="{{ route('accounts.show', [$data['account']['id']]) }}">{{ $data['account']['name'] }}</a>
                                        </h3>
                                        <p class="card-description">{{ account_balance($data['account']) }}</p>
                                    </div>
                                    <div class="card-tools d-print-none">
                                        <div class="dropdown">
                                            <button type="button" class="btn btn-outline-secondary btn-sm dropdown-toggle"
                                                    data-bs-toggle="dropdown" aria-expanded="false"
                                                    aria-label="{{ __('firefly.actions') }}">
                                                <span class="bi bi-three-dots"></span>
                                            </button>
                                            <ul class="dropdown-menu dropdown-menu-end">
                                                <li><a class="dropdown-item"
                                                       href="{{ route('transactions.create', ['withdrawal']) }}?source={{ $data['account']['id'] }}"><span class="bi bi-arrow-left"></span> {{ __('firefly.create_new_withdrawal') }}</a></li>
                                                <li><a class="dropdown-item"
                                                       href="{{ route('transactions.create', ['deposit']) }}?destination={{ $data['account']['id'] }}"><span class="bi bi-arrow-right"></span> {{ __('firefly.create_new_deposit') }}</a></li>
                                                <li><a class="dropdown-item"
                                                       href="{{ route('transactions.create', ['transfer']) }}?source={{ $data['account']['id'] }}"><span class="bi bi-arrow-left-right"></span> {{ __('firefly.create_new_transfer') }}</a></li>
                                                <li><hr class="dropdown-divider"></li>
                                                <li><a class="dropdown-item"
                                                       href="{{ route('accounts.show', [$data['account']['id']]) }}"><span class="bi bi-eye"></span> {{ __('firefly.show') }}</a></li>
                                                <li><a class="dropdown-item"
                                                       href="{{ route('accounts.reconcile', [$data['account']['id']]) }}"><span class="bi bi-check2-square"></span> {{ __('firefly.reconcile') }}</a></li>
                                                <li><a class="dropdown-item"
                                                       href="{{ route('accounts.edit', [$data['account']['id']]) }}?_from={{ urlencode($FF3_FROM) }}"><span class="bi bi-pencil"></span> {{ __('firefly.edit') }}</a></li>
                                                <li><a class="dropdown-item"
                                                       href="{{ route('accounts.delete', [$data['account']['id']]) }}"><span class="bi bi-trash"></span> {{ __('firefly.delete') }}</a></li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                                @if(count($data['transactions']) > 0)
                                    <div class="card-body p-0">
                                        <x-lists.groups-tiny :transactions="$data['transactions']"/>
                                    </div>
                                @endif
                                @if(0 === count($data['transactions']))
                                    <div class="card-body">
                                        <p class="text-muted mb-0">
                                            {{ __('firefly.no_transactions_account', ['name' => $data['account']['name']]) }}
                                        </p>
                                    </div>
                                @endif
                            </div>
                        </div>
                    @endforeach
                </div>
            </div>
            <div class="col-xl-4 ff-stack">
                @if($billCount > 0)
                    <!--BILLS -->
                    <div class="card ff-dashboard-card">
                        <div class="card-header">
                            <div>
                                <h3 class="card-title"><a href="{{ route('subscriptions.index') }}"
                                                          title="{{ __('firefly.bills') }}">{{ __('firefly.bills') }}</a></h3>
                            </div>
                            <div class="card-tools d-print-none">
                                <a href="{{ route('bills.index') }}" class="btn btn-outline-secondary btn-sm"
                                   aria-label="{{ __('firefly.go_to_bills') }}"><span class="bi bi-chevron-right"></span></a>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="ff-chart ff-chart-donut ff-chart-donut-sm">
                                <canvas id="bills-chart"></canvas>
                            </div>
                        </div>
                    </div>
                @endif

                <!--box for piggy bank data (JSON) -->
                <div id="piggy_bank_overview">
                    <div class="card ff-dashboard-card">
                        <div class="card-header">
                            <div>
                                <h3 class="card-title"><a href="{{ route('piggy-banks.index') }}"
                                                          title="{{ __('firefly.go_to_piggies') }}">{{ __('firefly.piggyBanks') }}</a></h3>
                            </div>
                            <div class="card-tools d-print-none">
                                <a href="{{ route('piggy-banks.index') }}" class="btn btn-outline-secondary btn-sm"
                                   aria-label="{{ __('firefly.go_to_piggies') }}"><span class="bi bi-chevron-right"></span></a>
                            </div>
                        </div>
                        <div class="card-body">
                            <template x-if="loadingPiggyBanks">
                                <div class="placeholder-glow">
                                    <span class="placeholder col-12 mb-3"></span>
                                    <span class="placeholder col-9"></span>
                                </div>
                            </template>
                            <template x-if="!loadingPiggyBanks && piggyBanks.length === 0">
                                <p class="text-muted mb-0">{{ __('firefly.no_piggies_intro_default') }}</p>
                            </template>
                            <template x-for="piggyBank in piggyBanks" :key="piggyBank.id">
                                <div class="ff-budget-row">
                                    <div class="ff-budget-top">
                                        <a class="ff-budget-name" :href="'./piggy-banks/show/' + piggyBank.id" :title="piggyBank.name"
                                           x-text="piggyBank.name"></a>
                                        <span class="ff-budget-amounts text-muted" x-text="piggyBank.amount"></span>
                                    </div>
                                    <div class="progress" role="progressbar" :aria-valuenow="piggyBank.percentage"
                                         aria-valuemin="0" aria-valuemax="100">
                                        <div class="progress-bar" :class="'w-'+piggyBank.percentage"></div>
                                    </div>
                                </div>
                            </template>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="row">
            <div class="col-xl-6">
                <!--EXPENSE ACCOUNTS -->
                <div class="card ff-dashboard-card">
                    <div class="card-header">
                        <div>
                            <h3 class="card-title"><a href="{{ route('accounts.index',['expense']) }}"
                                                      title="{{ __('firefly.expense_accounts') }}">{{ __('firefly.expense_accounts') }}</a></h3>
                        </div>
                        <div class="card-tools d-print-none">
                            <a href="{{ route('accounts.index', ['expense']) }}" class="btn btn-outline-secondary btn-sm"
                               aria-label="{{ __('firefly.go_to_expense_accounts') }}"><span class="bi bi-chevron-right"></span></a>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="ff-chart ff-chart-md">
                            <canvas id="expense-accounts-chart"></canvas>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-xl-6">
                <!--OPTIONAL REVENUE ACCOUNTS -->
                <div class="card ff-dashboard-card">
                    <div class="card-header">
                        <div>
                            <h3 class="card-title"><a href="{{ route('accounts.index',['revenue']) }}"
                                                      title="{{ __('firefly.revenue_accounts') }}">{{ __('firefly.revenue_accounts') }}</a></h3>
                        </div>
                        <div class="card-tools d-print-none">
                            <a href="{{ route('accounts.index', ['revenue']) }}" class="btn btn-outline-secondary btn-sm"
                               aria-label="{{ __('firefly.go_to_revenue_accounts') }}"><span class="bi bi-chevron-right"></span></a>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="ff-chart ff-chart-md">
                            <canvas id="revenue-accounts-chart"></canvas>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

@endsection
@section('scripts')
    @vite(['js/pages/dashboard/dashboard.js'])

     <script nonce="{{ $JS_NONCE }}">
        var billCount = {{ $billCount }};
        var accountRevenueUrl = '{{ route('chart.account.revenue') }}';
        var accountExpenseUrl = '{{ route('chart.account.expense') }}';
    </script>

     <script src="v1/js/lib/chart.umd.min.js?v={{ $FF_BUILD_TIME }}"
            nonce="{{ $JS_NONCE }}"></script>
     <script src="v1/js/lib/chartjs-plugin-annotation-3.min.js?v={{ $FF_BUILD_TIME }}"
            nonce="{{ $JS_NONCE }}"></script>
     <script src="v1/js/ff/charts.defaults.js?v={{ $FF_BUILD_TIME }}"
            nonce="{{ $JS_NONCE }}"></script>
     <script src="v1/js/ff/charts.js?v={{ $FF_BUILD_TIME }}" nonce="{{ $JS_NONCE }}"></script>
     <script src="v1/js/ff/index.js?v={{ $FF_BUILD_TIME }}" nonce="{{ $JS_NONCE }}"></script>

@endsection
