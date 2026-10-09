<!-- begin bottom navigation (phones and tablets) -->
<nav class="ff-bottom-nav d-lg-none d-print-none" aria-label="Quick navigation">
    <a href="{{ route('index') }}" class="ff-bottom-nav-item {{ \FireflyIII\Support\Blade\Navigation::menuItemActive('index') }}">
        <em class="bi bi-house"></em>
        <span>{{ __('firefly.dashboard') }}</span>
    </a>
    <a href="{{ route('transactions.index', ['all']) }}" class="ff-bottom-nav-item {{ menu_item_active_partial('transactions.') }}">
        <em class="bi bi-arrow-left-right"></em>
        <span>{{ __('firefly.transactions') }}</span>
    </a>
    <div class="dropup text-center">
        <button type="button" class="ff-bottom-nav-fab" data-bs-toggle="dropdown" aria-expanded="false"
                aria-label="{{ __('firefly.create_new_transaction') }}">
            <em class="bi bi-plus-lg"></em>
        </button>
        <ul class="dropdown-menu">
            <li>
                <a class="dropdown-item" href="{{ route('transactions.create', ['withdrawal']) }}?_from={{ urlencode($FF3_FROM) }}">
                    <em class="bi bi-arrow-left"></em> {{ __('firefly.create_new_withdrawal') }}
                </a>
            </li>
            <li>
                <a class="dropdown-item" href="{{ route('transactions.create', ['deposit']) }}?_from={{ urlencode($FF3_FROM) }}">
                    <em class="bi bi-arrow-right"></em> {{ __('firefly.create_new_deposit') }}
                </a>
            </li>
            <li>
                <a class="dropdown-item" href="{{ route('transactions.create', ['transfer']) }}?_from={{ urlencode($FF3_FROM) }}">
                    <em class="bi bi-arrow-left-right"></em> {{ __('firefly.create_new_transfer') }}
                </a>
            </li>
        </ul>
    </div>
    <a href="{{ route('budgets.index') }}" class="ff-bottom-nav-item {{ menu_item_active_partial('budgets.') }}">
        <em class="bi bi-pie-chart"></em>
        <span>{{ __('firefly.budgets') }}</span>
    </a>
    <a href="#" class="ff-bottom-nav-item" data-lte-toggle="sidebar" role="button">
        <em class="bi bi-list"></em>
        <span>{{ __('firefly.more') }}</span>
    </a>
</nav>
<!-- end bottom navigation -->
