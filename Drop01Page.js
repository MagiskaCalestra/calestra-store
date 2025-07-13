import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Drop01Page() {
  return (
    <div className="min-h-screen bg-white p-4 flex flex-col items-center justify-start space-y-8">
      <h1 className="text-4xl font-bold text-center mt-8">Drop 01 – Light by Lyra™</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-6xl">
        <Card>
          <CardContent className="p-4 flex flex-col items-center">
            <img src="/products/tshirt-mockup.jpg" alt="T-shirt" className="w-full max-w-xs rounded-lg shadow" />
            <h2 className="mt-4 font-semibold text-xl">Lyra T-shirt</h2>
            <p className="text-sm text-gray-500">349 kr – Premium bomull, unisex</p>
            <Button className="mt-4" asChild>
              <a href="https://forms.gle/PGQQLo4tuBaC5RXLA" target="_blank" rel="noopener noreferrer">
                Boka nu
              </a>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex flex-col items-center">
            <img src="/products/poster-lyra.jpg" alt="Poster" className="w-full max-w-xs rounded-lg shadow" />
            <h2 className="mt-4 font-semibold text-xl">Affisch "Lyra x Text"</h2>
            <p className="text-sm text-gray-500">179 kr – Tryckt på miljövänligt papper</p>
            <Button className="mt-4" asChild>
              <a href="https://forms.gle/PGQQLo4tuBaC5RXLA" target="_blank" rel="noopener noreferrer">
                Boka nu
              </a>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex flex-col items-center">
            <img src="/products/cwish-band.jpg" alt="C-Wish Armband" className="w-full max-w-xs rounded-lg shadow" />
            <h2 className="mt-4 font-semibold text-xl">C-Wish™ Armband</h2>
            <p className="text-sm text-gray-500">99 kr – Med QR-kod och energi</p>
            <Button className="mt-4" asChild>
              <a href="https://forms.gle/PGQQLo4tuBaC5RXLA" target="_blank" rel="noopener noreferrer">
                Boka nu
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="text-center text-sm text-gray-600 max-w-2xl">
        <p>Leverans inom 3–6 arbetsdagar. Alla produkter trycks på begäran via vår hållbara partner Gelato. Du får ett bekräftelsemail och spårning när bokningen är klar.</p>
      </div>
    </div>
  );
}
