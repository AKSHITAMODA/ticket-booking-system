package com.ticketbooking.backend.service;

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;

import com.ticketbooking.backend.entity.Booking;

@Service
public class QrCodeService {

    // =========================================================
    // GENERATE QR CODE
    // =========================================================

    public byte[] generateBookingQrCode(
            Booking booking) {

        String qrContent =
                buildQrContent(booking);

        try {

            QRCodeWriter qrCodeWriter =
                    new QRCodeWriter();

            Map<EncodeHintType, Object> hints =
                    new HashMap<>();

            hints.put(
                    EncodeHintType.CHARACTER_SET,
                    StandardCharsets.UTF_8.name()
            );

            hints.put(
                    EncodeHintType.MARGIN,
                    2
            );

            BitMatrix bitMatrix =
                    qrCodeWriter.encode(
                            qrContent,
                            BarcodeFormat.QR_CODE,
                            400,
                            400,
                            hints
                    );

            ByteArrayOutputStream outputStream =
                    new ByteArrayOutputStream();

            MatrixToImageWriter.writeToStream(
                    bitMatrix,
                    "PNG",
                    outputStream
            );

            return outputStream.toByteArray();

        } catch (WriterException e) {

            throw new RuntimeException(
                    "Unable to generate booking QR code",
                    e
            );

        } catch (Exception e) {

            throw new RuntimeException(
                    "Unable to create QR image",
                    e
            );
        }
    }

    // =========================================================
    // QR CONTENT
    // =========================================================

    private String buildQrContent(
            Booking booking) {

        StringBuilder content =
                new StringBuilder();

        content.append(
                "TICKETLY BOOKING"
        );

        content.append("\n");

        content.append(
                "Booking ID: "
        );

        content.append(
                booking.getId()
        );

        content.append("\n");

        content.append(
                "Event: "
        );

        content.append(
                booking.getEvent().getTitle()
        );

        content.append("\n");

        content.append(
                "Venue: "
        );

        content.append(
                booking.getEvent().getVenue()
        );

        content.append("\n");

        content.append(
                "Date: "
        );

        content.append(
                booking.getEvent().getEventDate()
        );

        content.append("\n");

        content.append(
                "Customer: "
        );

        content.append(
                booking.getUser().getName()
        );

        content.append("\n");

        content.append(
                "Email: "
        );

        content.append(
                booking.getUser().getEmail()
        );

        content.append("\n");

        content.append(
                "Seats: "
        );

        booking.getBookingSeats()
                .forEach(
                        bookingSeat -> {

                            content.append(
                                    bookingSeat
                                            .getSeat()
                                            .getSeatNumber()
                            );

                            content.append(" ");
                        }
                );

        content.append("\n");

        content.append(
                "Amount: ₹"
        );

        content.append(
                booking.getTotalAmount()
        );

        content.append("\n");

        content.append(
                "Status: "
        );

        content.append(
                booking.getStatus().name()
        );

        return content.toString();
    }
}