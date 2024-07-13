import dynamic from "next/dynamic";

/**
 * disable ssr to avoid pre-rendering issues of Next.js
 *
 * we're doing this because we're using a canvas element that can't be pre-rendered by Next.js on the server
 */
const App = dynamic(() => import("./App"), { ssr: false });

export default App;

// const App = () => {
//   return (
//     <div className="bg-black text-white flex justify-center items-center">
//       Hello World
//     </div>
//   );
// };

// export default App;
