// https://twitter.com/lusionltd/status/1701534187545636964
// https://lusion.co

import { Scene } from "./DEMO";
import Test1 from "./Test1";
import Test2 from "./Test2";

export const App = () => (
  <div className="container">
    <div className="nav">
      <h1 className="label" />
      <div />
      <span className="caption" />
      <div />
      <a href="https://lusion.co/">
        <div className="button">VISIT LUSION</div>
      </a>
      <div className="button gray">///</div>
    </div>
    <Scene style={{ borderRadius: 20 }} />
    {/* <Test1 /> */}
    {/* <Test2 /> */}
  </div>
);
