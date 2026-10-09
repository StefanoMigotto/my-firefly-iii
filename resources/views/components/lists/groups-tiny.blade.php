<table class="table table-valign-middle table-sm table-hover tx-list mb-0">
    @foreach($transactions as $transaction)
<tr>
    <td class="tx-col-icon w-10">
        <span class="tx-type-icon"><x-elements.transaction-type-icon :type="$transaction['transaction_type_type']" /></span>
    </td>
    <td class="tx-col-desc">
        @if('' !== (string) $transaction['transaction_group_title'])
            <small>{{ $transaction['transaction_group_title'] }}:</small>
        @endif
        <a class="" href="{{ route('transactions.show', [$transaction['transaction_group_id']]) }}">
            {{ $transaction['description'] }}
        </a>
    </td>
    <td class="tx-col-amount text-end w-30">
        <span class="small">
            <x-generic.amount :transaction="$transaction" />
        </span>
    </td>
</tr>
    @endforeach
</table>
