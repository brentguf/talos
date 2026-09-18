import { useFocusTrap } from '../a11y/useFocusTrap';
import './SaveButton.css';
import { formatDate } from '../utils/formatDate';

export function SaveButton() {
  useFocusTrap();
  return <button>{formatDate(new Date())}</button>;
}
