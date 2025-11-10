import React, { createContext, useContext, useState } from "react";

const BookingContext = createContext(null);
export function useBooking(){ return useContext(BookingContext); }

export function BookingProvider({children}){
  const [data, setData] = useState({
    date: null,
    nights: 1,
    adults: 2,
    children: 0,
    hotelTier: "standard", // standard | premium | signature
    ticketType: "1-park",
    addons: []
  });

  const update = (patch) => setData(prev => ({...prev, ...patch}));
  const reset = () => setData({
    date:null,nights:1,adults:2,children:0,hotelTier:"standard",ticketType:"1-park",addons:[]
  });

  return (
    <BookingContext.Provider value={{data, update, reset}}>
      {children}
    </BookingContext.Provider>
  );
}
