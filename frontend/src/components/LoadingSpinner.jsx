export default function LoadingSpinner({ message = 'Loading...' }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-dcs-black p-4">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-b-4 border-dcs-purple mx-auto mb-4"></div>
        <p className="text-dcs-text-gray text-base sm:text-lg animate-pulse">{message}</p>
      </div>
    </div>
  );
}