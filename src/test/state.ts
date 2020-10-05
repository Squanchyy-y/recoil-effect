import {effectAtom, effectSelector} from "recoil-effect/index";

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

const selectDevicesLength = effectSelector<Number>({
    key: `select_devices_length`,
    get: ({ get }) => {
        const devices = get($devices);
        return devices.length;
    }
});

const selectScannersLength = effectSelector<Number>({
    key: `select_scanners_length`,
    get: ({ get }) => {
        const scanners = get($scanners);
        return scanners.length;
    }
});

export const selectUnitsLength = effectSelector<Number>({
    key: `select_units_length`,
    get: ({ get }) => {
        const scannersLength = get(selectScannersLength);
        const devicesLength = get(selectDevicesLength);
        return +scannersLength + +devicesLength;
    }
});