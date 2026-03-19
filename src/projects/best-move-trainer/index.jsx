import BestMoveTrainer from './components/BestMoveTrainer';
import { ToastProvider } from './context/ToastContext';

export default function BestMoveTrainerWrapper() {
  return (
    <ToastProvider>
      <BestMoveTrainer />
    </ToastProvider>
  );
}
