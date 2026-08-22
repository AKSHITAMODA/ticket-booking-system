import api from "./api";

export const getEventSeats = async (eventId) => {
    const response = await api.get(`/api/seats/event/${eventId}`);
    return response.data;
};