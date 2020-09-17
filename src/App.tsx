import React from 'react';
import {Route, Link} from "react-router-dom"
import Devices from "./test/Devices";
import Scanners from "test/Scanners"
import Select from "test/Select"

function App() {
  return (
    <div className="App">
      <div>
        <Link to="/">
          devices
        </Link>
        <br/>
        <Link to="/scanners">
          scanners
        </Link>
        <br/>
        <Link to="/select">
          select
        </Link>
      </div>

      <br/>
      <br/>
      <br/>
      <br/>
      <br/>

      <Route path="/" exact>
        <Devices />
      </Route>
      <Route path="/scanners">
        <Scanners/>
      </Route>
      <Route path="/select">
        <Select />
      </Route>
    </div>
  );
}

export default App;