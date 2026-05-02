package com.artistico.mobile.feature.orders

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.artistico.mobile.core.model.Order
import com.artistico.mobile.core.network.HttpErrorParser
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class OrdersUiState(
    val loading: Boolean = true,
    val orders: List<Order> = emptyList(),
    val error: String? = null,
    val role: String = "buyer"
)

class OrdersViewModel(
    private val repository: OrdersRepository = OrdersRepository()
) : ViewModel() {

    private val _uiState = MutableStateFlow(OrdersUiState())
    val uiState: StateFlow<OrdersUiState> = _uiState.asStateFlow()

    init {
        loadOrders()
    }

    fun loadOrders(role: String = _uiState.value.role) {
        viewModelScope.launch {
            _uiState.update { it.copy(loading = true, error = null, role = role) }
            runCatching {
                val orders = repository.getOrders(role)
                _uiState.update { it.copy(loading = false, orders = orders) }
            }.onFailure { e ->
                _uiState.update { it.copy(loading = false, error = HttpErrorParser.parse(e)) }
            }
        }
    }

    fun switchRole(role: String) = loadOrders(role)
}
