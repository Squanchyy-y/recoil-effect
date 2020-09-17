import React from "react";
import * as _r from "recoil";

interface AtomSubscriber {
  mount: Function;
  unmount: Function;
  count: number;
  timerId?: NodeJS.Timeout;
}

interface EffectAtomOptions<T> extends _r.AtomOptions<T> {
  mount: (updater: _r.SetterOrUpdater<T>) => void;
  unmount: (updater: _r.SetterOrUpdater<T>) => void;
}

// saving of mount unmount methods as well as counter with the number of mounted atoms at the current moment
const subscribersAtoms = new Map<string, AtomSubscriber>(); 

//storing the keys of all atoms on which the selector depends
const subscribersSelectros = new Map<string, Array<string>>();

//the handler checks if there is an already mounted atom
const handleMountAtom = (key: string): boolean => {
  const subscriber = subscribersAtoms.get(key);

  if (subscriber) {
    if (subscriber.count === 0) { // if there are no mounted atoms
      if (subscriber.timerId) { //if pending unmounting, clear timeout
        clearTimeout(subscriber.timerId);
        subscriber.timerId = undefined;
      } else {
        subscriber.mount(); //else we call the mount method
      }
    } 
    subscriber.count += 1; // if the atom is already mounted, increment the counter
  }

  return !!subscriber;
};

const handleUnMountAtom = (key: string): boolean => {
  const subscriber = subscribersAtoms.get(key);

  if (subscriber) {
    subscriber.count -= 1; // decrement the counter if the atom has been mounted at least once
    if (subscriber.count <= 0) {
      subscriber.timerId = setTimeout(() => { // if it was the last mounted atom, queue the unmount
        subscriber.unmount();
        subscriber.timerId = undefined;
      }, 2000);
    }
  }

  return !!subscriber;
};

//the handler checks if there is an already mounted/unmounted selector
const handleSelector = (key: string, type: 'mount' | 'unmount' = 'mount'): boolean => {
  const dependencies = subscribersSelectros.get(key);

  if (dependencies) {
    dependencies.forEach((atomKey) => { // bypass all dependencies and call lifecycle methods
      (type === 'mount' ? handleMountAtom : handleUnMountAtom)(atomKey);
    });
  }

  return !!dependencies;
};

/**/
interface AtomEffectsOptions<T> {
  node: _r.RecoilState<T>;
  trigger: 'set' | 'get';
  setSelf: _r.SetterOrUpdater<T>;
  resetSelf: () => void;
  onSet: (newValue: T, oldValue: T) => void;
}

type Atom = <T>(
  options: _r.AtomOptions<T> & {
    effects_UNSTABLE: Array<(options: AtomEffectsOptions<T>) => void>;
  }
) => _r.RecoilState<T>;
/**/

 // a wrapper over an atom that saves all the necessary methods and throws a SetterOrUpdater into them
export const effectAtom = <T>({ mount, unmount, ...options }: EffectAtomOptions<T>) => {
  return (_r.atom as Atom)<T>({
    ...options,
    effects_UNSTABLE: [
      ({ setSelf }) => {
        subscribersAtoms.set(options.key, {
          mount: () => mount(setSelf),
          unmount: () => unmount(setSelf),
          count: 0,
        });
      },
    ],
  });
};

// a wrapper over a selector that preserves all of its dependencies
export const effectSelector = <T>({
  get,
  ...selectorOptions
}: _r.ReadOnlySelectorOptions<T> | _r.ReadWriteSelectorOptions<T>) => {
  return _r.selector<T>({
    ...selectorOptions,
    get: (options) => // we replace the get method to get all the dependencies
      get({
        get: (atom) => {
          const dependencies = subscribersSelectros.get(selectorOptions.key);

          if (dependencies) {
            dependencies.push(atom.key);
          } else subscribersSelectros.set(selectorOptions.key, [atom.key]);

          return options.get(atom);
        },
      }),
  });
};

// hook connecting the lifecycle methods of a component with the lifecycle of an atom/selector
const useRecoilEffect = (key: string) => {
  React.useEffect(() => {
    if (!handleMountAtom(key)) {
      handleSelector(key);

      return () => {
        handleSelector(key, 'unmount');
      };
    }

    return () => {
      handleUnMountAtom(key);
    };
  }, []);
};

// wrapper over useRecoilState that calls lifecycle methods
export const useRecoilEffectState = <T>(state: _r.RecoilState<T>): [T, _r.SetterOrUpdater<T>] => {
  const stateArray = _r.useRecoilState(state);
  useRecoilEffect(state.key);
  return stateArray;
};

// wrapper over useRecoilValue that calls lifecycle methods
export const useRecoilEffectValue = <T>(state: _r.RecoilState<T> | _r.RecoilValueReadOnly<T>): T => {
  const value = _r.useRecoilValue(state);
  useRecoilEffect(state.key);
  return value;
};
