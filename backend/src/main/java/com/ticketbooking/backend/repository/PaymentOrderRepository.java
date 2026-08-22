package com.ticketbooking.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.ticketbooking.backend.entity.PaymentOrder;
import com.ticketbooking.backend.entity.User;

public interface PaymentOrderRepository
        extends JpaRepository<PaymentOrder, Long> {

    Optional<PaymentOrder> findByRazorpayOrderId(
            String razorpayOrderId
    );

    Optional<PaymentOrder> findByRazorpayOrderIdAndUser(
            String razorpayOrderId,
            User user
    );
}