import { Home } from 'lucide-react';
import RoomCard from './RoomCard';

export default function RoomsGrid({ rooms, onRoomClick }) {
  if (rooms.length === 0) {
    return (
      <div className="bg-white rounded-[10px] p-12 text-center">
        <div className="w-16 h-16 rounded-lg mx-auto mb-5 flex items-center justify-center bg-neutral-50">
          <Home className="w-8 h-8 text-neutral-300" />
        </div>
        <p className="text-[13px] font-semibold text-neutral-800 mb-1">No rooms found</p>
        <p className="text-[11px] text-neutral-400 font-medium">Try adjusting your search or filters</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {rooms.map((room) => (
        <RoomCard key={room.id} room={room} onClick={onRoomClick} />
      ))}
    </div>
  );
}
