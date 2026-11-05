import React, { useState, useEffect } from 'react';
import { Wrench, PlusCircle, Calendar, Check, X, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import { MachineryListing, MachineryBooking } from '../../types';
import { formatINR } from '../../utils/currency';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../../components/Modal';
import { Badge } from '../../components/Badge';
import { getMachineryTypeLabel, getMachineryImage } from '../../components/MachineryCard';

export const MachineryDashboard: React.FC = () => {
  const { user } = useAuth();
  const [machinery, setMachinery] = useState<MachineryListing[]>([]);
  const [bookings, setBookings] = useState<MachineryBooking[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [machineryType, setMachineryType] = useState('tractor');
  const [rentalPrice, setRentalPrice] = useState<number | ''>(850);
  const [rentalUnit, setRentalUnit] = useState('hour');
  const [horsepower, setHorsepower] = useState('45 HP');
  const [fuelType, setFuelType] = useState('Diesel');
  const [town, setTown] = useState('Palladam');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [machRes, bookRes] = await Promise.all([
        api.get('/machinery'),
        api.get('/machinery/bookings/owner'),
      ]);
      if (machRes.data.success) {
        // filter owned by this user
        setMachinery(machRes.data.machinery.filter((m: MachineryListing) => m.ownerId === user?._id));
      }
      if (bookRes.data.success) {
        setBookings(bookRes.data.bookings);
      }
    } catch (err) {
      console.error('Failed to load machinery dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateMachinery = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await api.post('/machinery', {
        title,
        machineryType,
        rentalPrice: Number(rentalPrice),
        rentalUnit,
        specifications: { horsepower, fuelType },
        location: {
          town,
          district: user?.location.district || 'Tiruppur',
          state: user?.location.state || 'Tamil Nadu',
        },
        images: [`/machinery/${machineryType}.jpg`],
        description,
      });

      if (res.data.success) {
        setMachinery([res.data.machinery, ...machinery]);
        setModalOpen(false);
        setTitle('');
        setDescription('');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to list machinery.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBookingStatus = async (bookingId: string, status: string) => {
    try {
      const res = await api.patch(`/machinery/bookings/${bookingId}/status`, { status });
      if (res.data.success) {
        setBookings(bookings.map((b) => (b._id === bookingId ? res.data.booking : b)));
      }
    } catch (err) {
      console.error('Failed to update booking status:', err);
    }
  };

  const totalEarningsINR = bookings
    .filter((b) => b.status === 'accepted' || b.status === 'completed')
    .reduce((sum, b) => sum + b.totalAmount, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 uppercase">
            Machinery Fleet Hub
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight mt-1">
            Welcome, {user?.name}
          </h1>
          <p className="text-xs text-stone-500">
            {user?.farmOrBusinessName || 'Farm Mechanization Fleet'} • {user?.location.district}, {user?.location.state}
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add Machine to Fleet</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="text-xs text-stone-500 font-medium">Fleet Size</div>
          <div className="text-2xl font-black text-stone-900 mt-1">{machinery.length}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="text-xs text-stone-500 font-medium">Pending Requests</div>
          <div className="text-2xl font-black text-amber-600 mt-1">
            {bookings.filter((b) => b.status === 'pending').length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="text-xs text-stone-500 font-medium">Confirmed Bookings</div>
          <div className="text-2xl font-black text-emerald-700 mt-1">
            {bookings.filter((b) => b.status === 'accepted' || b.status === 'completed').length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="text-xs text-stone-500 font-medium">Rental Earnings (INR)</div>
          <div className="text-2xl font-black text-emerald-800 mt-1">{formatINR(totalEarningsINR)}</div>
        </div>
      </div>

      {/* Incoming Booking Requests */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-6 space-y-4">
        <h2 className="text-base font-bold text-stone-900">Incoming Machinery Rental Requests</h2>

        {bookings.length === 0 ? (
          <div className="text-center py-8 text-stone-400 text-xs">
            No rental requests received yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-stone-200 text-stone-500 font-bold uppercase text-[11px]">
                  <th className="py-2.5 px-3">Machinery</th>
                  <th className="py-2.5 px-3">Farmer / Renter</th>
                  <th className="py-2.5 px-3">Rental Schedule</th>
                  <th className="py-2.5 px-3">Field Location</th>
                  <th className="py-2.5 px-3 text-right">Total Amount (INR)</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {bookings.map((booking) => (
                  <tr key={booking._id} className="hover:bg-stone-50">
                    <td className="py-3 px-3 font-semibold text-stone-900">
                      {booking.machineryTitle}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-stone-900">{booking.renterName}</div>
                      <div className="text-[11px] text-stone-400">{booking.renterPhone}</div>
                    </td>
                    <td className="py-3 px-3 text-stone-700">
                      <div>{booking.durationUnits} {booking.unitType}s</div>
                      <div className="text-[10px] text-stone-400">
                        {new Date(booking.startDate).toLocaleDateString()} to {new Date(booking.endDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-stone-600 max-w-xs truncate">
                      {booking.bookingLocation?.address || booking.bookingLocation?.district}
                    </td>
                    <td className="py-3 px-3 text-right font-extrabold text-emerald-800">
                      {formatINR(booking.totalAmount)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <Badge
                        variant={
                          booking.status === 'accepted'
                            ? 'green'
                            : booking.status === 'pending'
                            ? 'amber'
                            : booking.status === 'rejected'
                            ? 'red'
                            : 'gray'
                        }
                        size="sm"
                      >
                        {booking.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-3 text-right">
                      {booking.status === 'pending' && (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleBookingStatus(booking._id, 'accepted')}
                            className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-[11px] font-semibold hover:bg-emerald-700"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleBookingStatus(booking._id, 'rejected')}
                            className="px-2.5 py-1 bg-rose-50 text-rose-600 rounded-lg text-[11px] font-semibold hover:bg-rose-100"
                          >
                            Decline
                          </button>
                        </div>
                      )}
                      {booking.status === 'accepted' && (
                        <button
                          onClick={() => handleBookingStatus(booking._id, 'completed')}
                          className="px-2.5 py-1 bg-emerald-700 text-white rounded-lg text-[11px] font-semibold hover:bg-emerald-800"
                        >
                          Mark Completed
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Fleet Listings */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-6 space-y-4">
        <h2 className="text-base font-bold text-stone-900">My Machinery Fleet</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {machinery.map((m) => (
            <div key={m._id} className="p-4 rounded-2xl border border-stone-200 bg-stone-50 space-y-2.5 overflow-hidden">
              <div className="aspect-16/10 rounded-xl overflow-hidden bg-stone-100">
                <img
                  src={getMachineryImage(m.machineryType, m.images)}
                  alt={m.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = getMachineryImage(m.machineryType);
                  }}
                />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full capitalize">
                  {getMachineryTypeLabel(m.machineryType)}
                </span>
                <Badge variant={m.availabilityStatus === 'available' ? 'green' : 'amber'} size="sm">
                  {m.availabilityStatus}
                </Badge>
              </div>
              <h3 className="font-bold text-stone-900 text-sm line-clamp-1">{m.title}</h3>
              <p className="text-xs text-stone-500 line-clamp-2">{m.description}</p>
              <div className="pt-2 border-t border-stone-200 flex justify-between items-center text-xs">
                <span className="font-extrabold text-emerald-800 text-sm">
                  {formatINR(m.rentalPrice)} / {m.rentalUnit}
                </span>
                <span className="text-stone-400 font-medium">Power: {m.specifications?.horsepower || 'Standard'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ADD MACHINERY MODAL */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add Machinery to Rental Fleet"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateMachinery} className="space-y-4 text-xs">
          {errorMsg && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-stone-700 font-semibold mb-1">Machinery Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Mahindra 575 DI Tractor with Rotavator"
              className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-stone-700 font-semibold mb-1">Machinery Category</label>
              <select
                value={machineryType}
                onChange={(e) => setMachineryType(e.target.value)}
                className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50 font-medium"
              >
                <option value="tractor">1. Tractor</option>
                <option value="rotavator">2. Rotavator</option>
                <option value="cultivator">3. Cultivator</option>
                <option value="power_tiller">4. Power Tiller</option>
                <option value="combine_harvester">5. Combine Harvester</option>
                <option value="paddy_transplanter">6. Paddy Transplanter</option>
                <option value="seed_drill">7. Seed Drill</option>
                <option value="sprayer">8. Agricultural Sprayer</option>
                <option value="thresher">9. Thresher</option>
                <option value="water_pump">10. Water Pump Set</option>
                <option value="tractor_trailer">11. Tractor Trailer</option>
                <option value="brush_cutter">12. Brush Cutter</option>
              </select>
            </div>

            <div>
              <label className="block text-stone-700 font-semibold mb-1">Town / Hub</label>
              <input
                type="text"
                value={town}
                onChange={(e) => setTown(e.target.value)}
                placeholder="e.g. Palladam / Kangeyam"
                className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50"
              />
            </div>
          </div>

          {/* Rental Pricing & Units */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-stone-50 rounded-2xl border border-stone-200">
            <div>
              <label className="block text-stone-700 font-semibold mb-1">Rental Rate (₹ / INR)</label>
              <input
                type="number"
                required
                min={0}
                value={rentalPrice}
                onChange={(e) => setRentalPrice(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="850"
                className="w-full p-2 border border-stone-200 rounded-xl bg-white font-bold"
              />
            </div>

            <div>
              <label className="block text-stone-700 font-semibold mb-1">Rental Unit</label>
              <select
                value={rentalUnit}
                onChange={(e) => setRentalUnit(e.target.value)}
                className="w-full p-2 border border-stone-200 rounded-xl bg-white font-semibold"
              >
                <option value="hour">Per Hour</option>
                <option value="day">Per Day</option>
                <option value="acre">Per Acre</option>
                <option value="hectare">Per Hectare</option>
                <option value="trip">Per Trip</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-stone-700 font-semibold mb-1">Horsepower (HP)</label>
              <input
                type="text"
                value={horsepower}
                onChange={(e) => setHorsepower(e.target.value)}
                placeholder="e.g. 45 HP"
                className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50"
              />
            </div>

            <div>
              <label className="block text-stone-700 font-semibold mb-1">Fuel Type</label>
              <select
                value={fuelType}
                onChange={(e) => setFuelType(e.target.value)}
                className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50"
              >
                <option value="Diesel">Diesel</option>
                <option value="Electric">Electric / Battery</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-stone-700 font-semibold mb-1">Specifications & Attachments Description</label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="List attachments included (e.g. 9-tyne cultivator, leveller, experienced driver included)..."
              className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors shadow-xs"
          >
            {submitting ? 'Registering Machine...' : 'Add Machinery to Marketplace'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

