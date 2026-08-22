package com.ticketbooking.backend.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "bookings")
public class Booking {

    public enum Status {
        CONFIRMED,
        CANCELLED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ================= USER =================

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // ================= EVENT =================

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    // ================= SEAT COUNT =================

    @Column(name = "number_of_seats", nullable = false)
    private Integer numberOfSeats;

    // ================= AMOUNT =================

    @Column(
        name = "total_amount",
        nullable = false,
        precision = 10,
        scale = 2
    )
    private BigDecimal totalAmount;

    // ================= STATUS =================

    @Column(nullable = false, length = 20)
    private Status status;

    // ================= CREATED AT =================

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    // ================= BOOKED SEATS =================

    @OneToMany(
        mappedBy = "booking",
        cascade = CascadeType.ALL,
        orphanRemoval = true,
        fetch = FetchType.LAZY
    )
    private List<BookingSeat> bookingSeats = new ArrayList<>();

    // ================= PRE PERSIST =================

    @PrePersist
    protected void onCreate() {

        createdAt = LocalDateTime.now();

        if (status == null) {
            status = Status.CONFIRMED;
        }
    }

    // ================= GETTERS =================

    public Long getId() {
        return id;
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

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public Status getStatus() {
        return status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public List<BookingSeat> getBookingSeats() {
        return bookingSeats;
    }

    // ================= SETTERS =================

    public void setUser(User user) {
        this.user = user;
    }

    public void setEvent(Event event) {
        this.event = event;
    }

    public void setNumberOfSeats(Integer numberOfSeats) {
        this.numberOfSeats = numberOfSeats;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    public void setStatus(Status status) {
        this.status = status;
    }

    public void setBookingSeats(List<BookingSeat> bookingSeats) {
        this.bookingSeats = bookingSeats;
    }

    // ================= HELPER =================

    public void addBookingSeat(BookingSeat bookingSeat) {

        bookingSeats.add(bookingSeat);
        bookingSeat.setBooking(this);
    }
}