import React from "react";
import { render, unmountComponentAtNode } from "react-dom";
import { act } from "react-dom/test-utils";
import * as _re from "./index";
import { RecoilRoot, RecoilState, RecoilValueReadOnly } from "recoil";

let container: HTMLElement | null;

const getTestRecoilEffect = (obj: { [key: string]: number }) => {
  const atom = _re.effectsAtom<Array<string>>({
    key: `testEffectAtom`,
    default: [],
    mount: () => {
      obj.value += 1;
    },
    unmount: () => {
      obj.value -= 1;
    },
  });

  const selector1 = _re.effectsSelector({
    key: `testSelector1`,
    get: ({ get }) => get(atom),
  });

  const selector2 = _re.effectsSelector({
    key: `testSelector2`,
    get: ({ get }) => get(selector1),
  });

  const useTest = (
    _state: RecoilState<string[]> | RecoilValueReadOnly<string[]>
  ) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const state = _re.useRecoilEffectsValue(_state);
    React.useEffect(() => {
      obj.count += 1;

      return () => {
        obj.count -= 1;
      };
    }, []);
  };

  return { atom, selectors: [selector1, selector2], useTest };
};

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
});

afterEach(() => {
  if (container) {
    unmountComponentAtNode(container);
    container.remove();
    container = null;
  }
});

it(`testing recoil-effect - effect-atom`, (done) => {
  const obj = {
    count: 0,
    value: 0,
  };

  const { atom, useTest } = getTestRecoilEffect(obj);

  const Component = () => {
    useTest(atom);
    return null;
  };

  act(() => {
    render(
      <RecoilRoot>
        <Component />
        <Component />
      </RecoilRoot>,
      container
    );
  });

  expect(obj.value).toBe(1);
  expect(obj.count).toBe(2);

  act(() => {
    render(<RecoilRoot></RecoilRoot>, container);
  });

  expect(obj.value).toBe(1);
  expect(obj.count).toBe(0);

  act(() => {
    render(
      <RecoilRoot>
        <Component />
        <Component />
        <Component />
      </RecoilRoot>,
      container
    );
  });

  expect(obj.value).toBe(1);
  expect(obj.count).toBe(3);

  act(() => {
    render(<></>, container);
  });

  setTimeout(() => {
    expect(obj.value).toBe(0);
    expect(obj.count).toBe(0);
    done();
  }, 2500);
});

it(`testing recoil-effect - effect-selector`, (done) => {
  const obj = {
    count: 0,
    value: 0,
  };

  const { atom, useTest, selectors } = getTestRecoilEffect(obj);

  const AtomComponent = () => {
    useTest(atom);
    return null;
  };

  const SelectorComponent = () => {
    useTest(selectors[0]);
    return null;
  };

  act(() => {
    render(
      <RecoilRoot>
        <AtomComponent />
        <SelectorComponent />
      </RecoilRoot>,
      container
    );
  });

  expect(obj.value).toBe(1);
  expect(obj.count).toBe(2);

  act(() => {
    render(<RecoilRoot></RecoilRoot>, container);
  });

  expect(obj.value).toBe(1);
  expect(obj.count).toBe(0);

  act(() => {
    render(
      <RecoilRoot>
        <SelectorComponent />
        <AtomComponent />
        <SelectorComponent />
      </RecoilRoot>,
      container
    );
  });

  expect(obj.value).toBe(1);
  expect(obj.count).toBe(3);

  act(() => {
    render(<></>, container);
  });

  setTimeout(() => {
    expect(obj.value).toBe(0);
    expect(obj.count).toBe(0);
    done();
  }, 2500);
});

it(`testing recoil-effect - effect-transitive-selector`, (done) => {
  const obj = {
    count: 0,
    value: 0,
  };

  const { atom, useTest, selectors } = getTestRecoilEffect(obj);

  const AtomComponent = () => {
    useTest(atom);
    return null;
  };

  const SelectorComponent = () => {
    useTest(selectors[1]);
    return null;
  };

  act(() => {
    render(
      <RecoilRoot>
        <AtomComponent />
        <SelectorComponent />
      </RecoilRoot>,
      container
    );
  });

  expect(obj.value).toBe(1);
  expect(obj.count).toBe(2);

  act(() => {
    render(<RecoilRoot></RecoilRoot>, container);
  });

  expect(obj.value).toBe(1);
  expect(obj.count).toBe(0);

  act(() => {
    render(
      <RecoilRoot>
        <SelectorComponent />
        <AtomComponent />
        <SelectorComponent />
      </RecoilRoot>,
      container
    );
  });

  expect(obj.value).toBe(1);
  expect(obj.count).toBe(3);

  act(() => {
    render(<></>, container);
  });

  setTimeout(() => {
    expect(obj.value).toBe(0);
    expect(obj.count).toBe(0);
    done();
  }, 2500);
});
