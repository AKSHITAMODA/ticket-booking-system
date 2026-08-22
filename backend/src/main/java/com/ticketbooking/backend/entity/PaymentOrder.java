package com.ticketbooking.backend.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "payment_orders")
public class PaymentOrder {

    public enum Status {
        CREATED,
        PAID,
        FAILED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(
        name = "razorpay_order_id",
        nullable = false,
        unique = true
    )
    private String razorpayOrderId;

    @Column(name = "razorpay_payment_id")
    private String razorpayPaymentId;

    // ================= USER =================

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // ================= EVENT =================

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    // ================= SEATS =================

    @Column(name = "number_of_seats", nullable = false)
    private Integer numberOfSeats;

    /*
     * Stores selected seat IDs.
     *
     * Example:
     *
     * [1,2,3]
     */
    @Column(
        name = "seat_ids",
        nullable = false,
        columnDefinition = "TEXT"
    )
    private String seatIds;

    // ================= AMOUNT =================

    @Column(
        name = "amount",
        nullable = false,
        precision = 10,
        scale = 2
    )
    private BigDecimal amount;

    // ================= STATUS =================

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status;

    // ================= BOOKING =================

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id")
    private Booking booking;

    // ================= CREATED AT =================

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {

        createdAt = LocalDateTime.now();

        if (status == null) {
            status = Status.CREATED;
        }
    }

    // ================= GETTERS =================

    public Long getId() {
        return id;
    }

    public String getRazorpayOrderId() {
        return razorpayOrderId;
    }

    public String getRazorpayPaymentId() {
        return razorpayPaymentId;
    }

    public User getUser() {
        return user;
    }

    public Event getEvent() {
        return event;
    }

    public Integer getNumberOfSeats() {
        return numberOfSeats;
    }

    public String getSeatIds() {
        return seatIds;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public Status getStatus() {
        return status;
    }

    public Booking getBooking() {
        return booking;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    // ================= SETTERS =================

    public void setRazorpayOrderId(
            String razorpayOrderId) {

        this.razorpayOrderId =
                razorpayOrderId;
    }

    public void setRazorpayPaymentId(
            String razorpayPaymentId) {

        this.razorpayPaymentId =
                razorpayPaymentId;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public void setEvent(Event event) {
        this.event = event;
    }

    public void setNumberOfSeats(
            Integer numberOfSeats) {

        this.numberOfSeats =
                numberOfSeats;
    }

    public void setSeatIds(String seatIds) {
        this.seatIds = seatIds;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public void setStatus(Status status) {
        this.status = status;
    }

    public void setBooking(Booking booking) {
        this.booking = booking;
    }
}