package com.ticketbooking.backend.service;

import java.nio.charset.StandardCharsets;
import java.time.format.DateTimeFormatter;
import java.util.stream.Collectors;

import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import com.ticketbooking.backend.entity.Booking;
import com.ticketbooking.backend.entity.BookingSeat;

import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {

    private final JavaMailSender mailSender;
    private final QrCodeService qrCodeService;

    public EmailService(
            JavaMailSender mailSender,
            QrCodeService qrCodeService) {

        this.mailSender = mailSender;
        this.qrCodeService = qrCodeService;
    }

    // =========================================================
    // SEND BOOKING CONFIRMATION
    // =========================================================

    public void sendBookingConfirmation(
            Booking booking) {

        try {

            byte[] qrCode =
                    qrCodeService
                            .generateBookingQrCode(
                                    booking
                            );

            MimeMessage message =
                    mailSender.createMimeMessage();

            MimeMessageHelper helper =
                    new MimeMessageHelper(
                            message,
                            true,
                            StandardCharsets.UTF_8.name()
                    );

            String customerEmail =
                    booking.getUser().getEmail();

            String customerName =
                    booking.getUser().getName();

            String eventTitle =
                    booking.getEvent().getTitle();

            String venue =
                    booking.getEvent().getVenue();

            String eventDate =
                    booking.getEvent()
                            .getEventDate()
                            .format(
                                    DateTimeFormatter.ofPattern(
                                            "dd MMM yyyy, hh:mm a"
                                    )
                            );

            String seats =
                    booking.getBookingSeats()
                            .stream()
                            .map(
                                    BookingSeat::getSeat
                            )
                            .map(
                                    seat ->
                                            seat.getSeatNumber()
                            )
                            .collect(
                                    Collectors.joining(", ")
                            );

            helper.setTo(
                    customerEmail
            );

            helper.setSubject(
                    "Ticketly Booking Confirmed - "
                            + eventTitle
            );

            helper.setText(
                    buildEmailBody(
                            customerName,
                            eventTitle,
                            venue,
                            eventDate,
                            seats,
                            booking
                    ),
                    true
            );

            helper.addAttachment(
                    "ticketly-booking-"
                            + booking.getId()
                            + "-qr.png",
                    new ByteArrayResource(qrCode)
            );

            mailSender.send(message);

        } catch (Exception e) {

            throw new RuntimeException(
                    "Unable to send booking confirmation email",
                    e
            );
        }
    }

    // =========================================================
    // EMAIL HTML
    // =========================================================

    private String buildEmailBody(
            String customerName,
            String eventTitle,
            String venue,
            String eventDate,
            String seats,
            Booking booking) {

        return """
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <title>Ticketly Booking Confirmation</title>
                </head>

                <body style="
                    margin:0;
                    padding:0;
                    background:#f4f4f8;
                    font-family:Arial,Helvetica,sans-serif;
                ">

                    <div style="
                        max-width:650px;
                        margin:40px auto;
                        background:#ffffff;
                        border-radius:16px;
                        overflow:hidden;
                        box-shadow:0 8px 30px rgba(0,0,0,0.08);
                    ">

                        <div style="
                            background:linear-gradient(
                                135deg,
                                #4f46e5,
                                #9333ea
                            );
                            color:white;
                            padding:32px;
                        ">

                            <h1 style="
                                margin:0;
                                font-size:30px;
                            ">
                                Ticketly
                            </h1>

                            <p style="
                                margin:8px 0 0;
                                opacity:0.9;
                            ">
                                Your booking is confirmed!
                            </p>

                        </div>

                        <div style="padding:32px;">

                            <h2 style="
                                margin-top:0;
                                color:#111827;
                            ">
                                Hi %s,
                            </h2>

                            <p style="
                                color:#4b5563;
                                line-height:1.6;
                            ">
                                Your payment was successful and
                                your ticket has been confirmed.
                            </p>

                            <div style="
                                background:#f8fafc;
                                border-radius:12px;
                                padding:24px;
                                margin:24px 0;
                            ">

                                <h2 style="
                                    margin-top:0;
                                    color:#111827;
                                ">
                                    %s
                                </h2>

                                <p>
                                    <strong>Booking ID:</strong>
                                    #%d
                                </p>

                                <p>
                                    <strong>Venue:</strong>
                                    %s
                                </p>

                                <p>
                                    <strong>Date:</strong>
                                    %s
                                </p>

                                <p>
                                    <strong>Seats:</strong>
                                    %s
                                </p>

                                <p>
                                    <strong>Total Amount:</strong>
                                    ₹%s
                                </p>

                                <p>
                                    <strong>Status:</strong>
                                    CONFIRMED
                                </p>

                            </div>

                            <p style="
                                color:#4b5563;
                                line-height:1.6;
                            ">
                                Your QR ticket is attached to this
                                email. Please keep it available
                                when you arrive at the venue.
                            </p>

                            <p style="
                                color:#6b7280;
                                font-size:13px;
                                margin-top:30px;
                            ">
                                Thank you for booking with Ticketly.
                            </p>

                        </div>

                    </div>

                </body>
                </html>
                """.formatted(
                        escapeHtml(customerName),
                        escapeHtml(eventTitle),
                        booking.getId(),
                        escapeHtml(venue),
                        escapeHtml(eventDate),
                        escapeHtml(seats),
                        booking.getTotalAmount()
                );
    }

    // =========================================================
    // BASIC HTML ESCAPING
    // =========================================================

    private String escapeHtml(
            String value) {

        if (value == null) {
            return "";
        }

        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }
}