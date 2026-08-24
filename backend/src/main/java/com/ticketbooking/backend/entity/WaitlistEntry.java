package com.ticketbooking.backend.entity;

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
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(
    name = "waitlist_entries",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uk_waitlist_event_user_category",
            columnNames = {
                "event_id",
                "user_id",
                "category"
            }
        )
    }
)
public class WaitlistEntry {

    // =========================================================
    // STATUS
    // =========================================================

    public enum Status {
        WAITING,
        OFFERED,
        FULFILLED,
        EXPIRED,
        CANCELLED
    }

    // =========================================================
    // CATEGORY
    // =========================================================

    public enum Category {
        PREMIUM,
        STANDARD
    }

    // =========================================================
    // ID
    // =========================================================

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // =========================================================
    // EVENT
    // =========================================================

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
        name = "event_id",
        nullable = false
    )
    private Event event;

    // =========================================================
    // USER
    // =========================================================

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
        name = "user_id",
        nullable = false
    )
    private User user;

    // =========================================================
    // CATEGORY
    // =========================================================

    @Enumerated(EnumType.STRING)
    @Column(
        nullable = false,
        length = 20
    )
    private Category category;

    // =========================================================
    // POSITION
    // =========================================================

    @Column(
        nullable = false
    )
    private Integer position;

    // =========================================================
    // STATUS
    // =========================================================

    @Enumerated(EnumType.STRING)
    @Column(
        nullable = false,
        length = 20
    )
    private Status status;

    // =========================================================
    // OFFERED SEAT
    // =========================================================

    /*
     * Seat temporarily offered to this waitlist customer.
     *
     * NULL while the customer is WAITING.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
        name = "offered_seat_id"
    )
    private Seat offeredSeat;

    // =========================================================
    // CREATED AT
    // =========================================================

    @Column(
        name = "created_at",
        nullable = false
    )
    private LocalDateTime createdAt;

    // =========================================================
    // OFFER EXPIRY
    // =========================================================

    /*
     * Used only when status = OFFERED.
     */
    @Column(
        name = "offer_expires_at"
    )
    private LocalDateTime offerExpiresAt;

    // =========================================================
    // PRE PERSIST
    // =========================================================

    @PrePersist
    protected void onCreate() {

        createdAt = LocalDateTime.now();

        if (status == null) {
            status = Status.WAITING;
        }
    }

    // =========================================================
    // GETTERS
    // =========================================================

    public Long getId() {
        return id;
    }

    public Event getEvent() {
        return event;
    }

    public User getUser() {
        return user;
    }

    public Category getCategory() {
        return category;
    }

    public Integer getPosition() {
        return position;
    }

    public Status getStatus() {
        return status;
    }

    public Seat getOfferedSeat() {
        return offeredSeat;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getOfferExpiresAt() {
        return offerExpiresAt;
    }

    // =========================================================
    // SETTERS
    // =========================================================

    public void setEvent(Event event) {
        this.event = event;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public void setCategory(Category category) {
        this.category = category;
    }

    public void setPosition(Integer position) {
        this.position = position;
    }

    public void setStatus(Status status) {
        this.status = status;
    }

    public void setOfferedSeat(Seat offeredSeat) {
        this.offeredSeat = offeredSeat;
    }

    public void setOfferExpiresAt(
            LocalDateTime offerExpiresAt) {

        this.offerExpiresAt = offerExpiresAt;
    }
}