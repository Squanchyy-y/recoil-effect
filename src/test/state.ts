import {effectAtom, effectSelector} from "recoil-effect";

export const $devices = effectAtom<Array<Device>>({
    key: `devices`,
    default: [],
    mount: () => {
        console.warn(`mount_devices`);
    },
    unmount: () => {
        console.warn(`unmount_devices`);
    }
})

export const $scanners = effectAtom<Array<Scanner>>({
    key: `scanners`,
    default: [],
    mount: () => {
        console.warn(`mount_scanners`);
    },
    unmount: () => {
        console.warn(`unmount_scanners`);
    }
});

export const selectDevices = effectSelector<Array<Device | Scanner>>({
    key: `select_devices`,
    get: ({get}) => {
        const devices = get($devices);
        const scanners = get($scanners);
        return [...devices, ...scanners];
    }
})