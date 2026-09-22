import { render } from '@testing-library/react';
import { axe } from 'vitest-axe';
import 'vitest-axe/extend-expect';
import { expect, it } from 'vitest';

import { SaveButton } from './SaveButton';

it('has no accessibility violations', async () => {
  const { container } = render(<SaveButton />);

  expect(await axe(container)).toHaveNoViolations();
});
