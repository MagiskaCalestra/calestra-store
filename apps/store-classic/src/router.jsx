 import App from "./App.jsx";
 import Shop from "./pages/Shop.jsx";
 import Product from "./pages/Product.jsx"; // â¬…ï¸ NY
import Checkout from "./pages/Checkout.jsx";
import Thanks from "./pages/Thanks.jsx";

 export default createBrowserRouter([
   {
     path: "/",
     element: <App />,
     children: [
       { path: "/shop", element: <Shop /> },
       { path: "/product/:slug", element: <Product /> }, // â¬…ï¸ NY
       { path: "/checkout", element: <Checkout /> },
       { path: "/thanks/:id", element: <Thanks /> },
       // ...övriga
     ],
   },
 ]);
