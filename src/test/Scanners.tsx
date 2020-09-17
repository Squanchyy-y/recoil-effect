import React from "react";
import {useRecoilEffectValue} from "recoil-effect"
import {$scanners} from "./state";

const Scanners = () => {
    const scanners = useRecoilEffectValue($scanners);
    return <div>{scanners.map(({name}) => <div key={name}>{name}</div>)}</div>;
}

export default Scanners