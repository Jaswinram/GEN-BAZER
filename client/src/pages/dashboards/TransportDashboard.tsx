import React, { useState, useEffect } from 'react';
import {
  Truck,
  PlusCircle,
  MapPin,
  Check,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  Weight
} from 'lucide-react';
import api from '../../services/api';
import { TransportListing, TransportBooking } from '../../types';
import { formatINR } from '../../utils/currency';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../../components/Modal';
import { Badge } from '../../components/Badge';
import { getVehicleCategoryLabel, getVehicleImage } from '../../components/TransportCard';

export const TransportDashboard: React.FC = () => {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<TransportListing[]>([]);
  const [requests, setRequests] = useState<TransportBooking[]>([]);
  const [loading, setLoading] = useState(true);

  // Vehicle Registration Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [vehicleName, setVehicleName] = useState('');
  const [vehicleType, setVehicleType] = useState('moped_carrier');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [carryingCapacityKg, setCarryingCapacityKg] = useState<number | ''>(60);
  const [pricingModel, setPricingModel] = useState('per_trip');
  const [baseRate, setBaseRate] = useState<number | ''>(180);
  const [additionalCharges, setAdditionalCharges] = useState<number | ''>(20);
  const [town, setTown] = useState('Kinathukadavu Hub');
  const [serviceAreas, setServiceAreas] = useState('Coimbatore, Pollachi, Kinathukadavu');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Quote Modal
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [activeRequest, setActiveRequest] = useState<TransportBooking | null>(null);
  const [quotedPrice, setQuotedPrice] = useState<number | ''>('');
  const [providerNotes, setProviderNotes] = useState('');

  // Driver Assignment Modal
  const [driverModalOpen, setDriverModalOpen] = useState(false);
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');

  const fetchData = async () => {
    try {
      const [transRes, reqRes] = await Promise.all([
        api.get('/transport'),
        api.get('/transport/requests/provider'),
      ]);
      if (transRes.data.success) {
        setVehicles(transRes.data.transport.filter((t: TransportListing) => t.providerId === user?._id));
      }
      if (reqRes.data.success) {
        setRequests(reqRes.data.requests);
      }
    } catch (err) {
      console.error('Failed to load transport dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRegisterVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await api.post('/transport', {
        vehicleName,
        vehicleType,
        vehicleNumber,
        carryingCapacityKg: Number(carryingCapacityKg),
        pricingModel,
        baseRate: Number(baseRate),
        additionalCharges: Number(additionalCharges || 0),
        pickupLocation: {
          town,
          district: user?.location.district || 'Coimbatore',
          state: user?.location.state || 'Tamil Nadu',
        },
        serviceAreas: serviceAreas.split(',').map((s) => s.trim()),
        images: [`/vehicles/${vehicleType}.jpg`],
        description,
      });

      if (res.data.success) {
        setVehicles([res.data.transport, ...vehicles]);
        setModalOpen(false);
        setVehicleNumber('');
        setVehicleName('');
        setDescription('');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to register vehicle.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (requestId: string, status: string, driverInfo?: any) => {
    try {
      const payload: any = { status };
      if (driverInfo) payload.driverInfo = driverInfo;
      const res = await api.patch(`/transport/requests/${requestId}`, payload);
      if (res.data.success) {
        setRequests(requests.map((r) => (r._id === requestId ? res.data.booking : r)));
        setDriverModalOpen(false);
        setActiveRequest(null);
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleSendQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRequest) return;
    try {
      const res = await api.patch(`/transport/requests/${activeRequest._id}`, {
        quotedPrice: Number(quotedPrice),
        providerNotes,
      });
      if (res.data.success) {
        setRequests(requests.map((r) => (r._id === activeRequest._id ? res.data.booking : r)));
        setQuoteModalOpen(false);
        setActiveRequest(null);
      }
    } catch (err) {
      console.error('Failed to quote:', err);
    }
  };

  const handleAssignDriver = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRequest) return;
    handleStatusUpdate(activeRequest._id, 'driver_assigned', {
      name: driverName.trim(),
      phone: driverPhone.trim(),
    });
  };

  const totalEarningsINR = requests
    .filter((r) => r.status === 'delivered')
    .reduce((sum, r) => sum + (r.estimatedOrQuotedPrice || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 uppercase">
            Transport & Freight Operations
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight mt-1">
            Welcome, {user?.name}
          </h1>
          <p className="text-xs text-stone-500">
            {user?.farmOrBusinessName || 'Agri Transport Provider'} • {user?.location.district}, {user?.location.state}
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Register Vehicle to Fleet</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="text-xs text-stone-500 font-medium">Registered Vehicles</div>
          <div className="text-2xl font-black text-stone-900 mt-1">{vehicles.length}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="text-xs text-stone-500 font-medium">Pending Requests</div>
          <div className="text-2xl font-black text-amber-600 mt-1">
            {requests.filter((r) => r.status === 'pending').length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="text-xs text-stone-500 font-medium">In Transit / Assigned</div>
          <div className="text-2xl font-black text-blue-700 mt-1">
            {requests.filter((r) => ['driver_assigned', 'pickup_completed', 'in_transit', 'accepted'].includes(r.status)).length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="text-xs text-stone-500 font-medium">Completed Freight (INR)</div>
          <div className="text-2xl font-black text-emerald-800 mt-1">{formatINR(totalEarningsINR)}</div>
        </div>
      </div>

      {/* Transport Requests Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-stone-900">Farm-to-Mandi Dispatch Requests</h2>
          <span className="text-xs text-stone-500">{requests.length} total orders</span>
        </div>

        {requests.length === 0 ? (
          <div className="text-center py-8 text-stone-400 text-xs">
            No transit requests received yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-stone-200 text-stone-500 font-bold uppercase text-[11px]">
                  <th className="py-2.5 px-3">Customer / Farmer</th>
                  <th className="py-2.5 px-3">Pickup & Delivery Route</th>
                  <th className="py-2.5 px-3">Cargo & Weight</th>
                  <th className="py-2.5 px-3 text-right">Freight Rate (INR)</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-right">Dispatch Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {requests.map((r) => {
                  const weightKg = r.cargoWeightKg || (r.cargoWeightTonnes ? r.cargoWeightTonnes * 1000 : 0);
                  return (
                    <tr key={r._id} className="hover:bg-stone-50">
                      <td className="py-3 px-3">
                        <div className="font-bold text-stone-900">{r.requesterName}</div>
                        <div className="text-[11px] text-stone-400">{r.requesterPhone}</div>
                        {r.pickupTime && (
                          <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                            Pickup at {r.pickupTime}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-stone-700 max-w-xs">
                        <div><strong className="text-stone-900">From:</strong> {r.pickupAddress}</div>
                        <div><strong className="text-stone-900">To:</strong> {r.deliveryAddress}</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-medium text-stone-800">{r.cargoType}</div>
                        <div className="text-[11px] font-bold text-emerald-700">{weightKg} kg Payload</div>
                      </td>
                      <td className="py-3 px-3 text-right font-extrabold text-emerald-800">
                        {r.isQuotationRequired && r.status === 'pending'
                          ? 'Quote Pending'
                          : formatINR(r.estimatedOrQuotedPrice || 0)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <Badge
                          variant={
                            r.status === 'delivered'
                              ? 'green'
                              : r.status === 'in_transit' || r.status === 'pickup_completed'
                              ? 'blue'
                              : r.status === 'driver_assigned'
                              ? 'purple'
                              : r.status === 'accepted'
                              ? 'indigo'
                              : r.status === 'pending'
                              ? 'amber'
                              : 'gray'
                          }
                          size="sm"
                        >
                          {r.status.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-right space-x-1 whitespace-nowrap">
                        {r.isQuotationRequired && r.status === 'pending' && (
                          <button
                            onClick={() => {
                              setActiveRequest(r);
                              setQuotedPrice('');
                              setQuoteModalOpen(true);
                            }}
                            className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[11px] font-semibold"
                          >
                            Submit Quote
                          </button>
                        )}
                        {r.status === 'pending' && !r.isQuotationRequired && (
                          <button
                            onClick={() => handleStatusUpdate(r._id, 'accepted')}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-semibold"
                          >
                            Accept
                          </button>
                        )}
                        {(r.status === 'accepted' || (r.status === 'pending' && !r.isQuotationRequired)) && (
                          <button
                            onClick={() => {
                              setActiveRequest(r);
                              setDriverName('');
                              setDriverPhone(user?.phone || '');
                              setDriverModalOpen(true);
                            }}
                            className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-[11px] font-semibold"
                          >
                            Assign Driver
                          </button>
                        )}
                        {r.status === 'driver_assigned' && (
                          <button
                            onClick={() => handleStatusUpdate(r._id, 'pickup_completed')}
                            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-semibold"
                          >
                            Pickup Done
                          </button>
                        )}
                        {r.status === 'pickup_completed' && (
                          <button
                            onClick={() => handleStatusUpdate(r._id, 'in_transit')}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-semibold"
                          >
                            In Transit
                          </button>
                        )}
                        {r.status === 'in_transit' && (
                          <button
                            onClick={() => handleStatusUpdate(r._id, 'delivered')}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-semibold"
                          >
                            Mark Delivered
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Vehicles Grid */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-6 space-y-4">
        <h2 className="text-base font-bold text-stone-900">My Registered Transport Vehicles</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {vehicles.map((v) => {
            const capKg = v.carryingCapacityKg || (v.carryingCapacityTonnes ? v.carryingCapacityTonnes * 1000 : 0);
            return (
              <div key={v._id} className="p-4 rounded-2xl border border-stone-200 bg-stone-50 space-y-2.5 overflow-hidden">
                <div className="aspect-16/9 rounded-xl overflow-hidden bg-stone-100">
                  <img
                    src={getVehicleImage(v.vehicleType, v.images)}
                    alt={v.vehicleNumber}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = getVehicleImage(v.vehicleType);
                    }}
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-stone-900 text-sm">{v.vehicleName || v.vehicleNumber}</span>
                  <span className="text-[11px] text-emerald-800 font-bold bg-emerald-100 px-2 py-0.5 rounded-md">
                    {capKg} kg Verified
                  </span>
                </div>
                <div className="text-xs text-stone-600 font-mono">
                  {v.vehicleNumber} • {getVehicleCategoryLabel(v.vehicleType)}
                </div>
                <div className="text-xs text-stone-500 line-clamp-1">
                  Routes: {v.serviceAreas.join(', ')}
                </div>
                <div className="pt-2 border-t border-stone-200 flex justify-between items-center text-xs font-bold text-emerald-800">
                  <span>
                    {v.pricingModel === 'custom_quotation'
                      ? 'Custom Quote'
                      : `${formatINR(v.baseRate)} (${v.pricingModel.replace('_', ' ')})`}
                  </span>
                  <Badge variant={v.availabilityStatus === 'available' ? 'green' : 'gray'} size="sm">
                    {v.availabilityStatus}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* REGISTER VEHICLE MODAL */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Register Agricultural Transport Vehicle"
        maxWidth="lg"
      >
        <form onSubmit={handleRegisterVehicle} className="space-y-4 text-xs">
          {errorMsg && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-stone-700 font-semibold mb-1">Vehicle Name / Model</label>
            <input
              type="text"
              required
              value={vehicleName}
              onChange={(e) => setVehicleName(e.target.value)}
              placeholder="e.g. TVS XL 100 Heavy Duty Goods Carrier"
              className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50 font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-stone-700 font-semibold mb-1">Vehicle Registration No.</label>
              <input
                type="text"
                required
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value)}
                placeholder="e.g. TN 38 BX 5421"
                className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50 uppercase font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-stone-700 font-semibold mb-1">Vehicle Category</label>
              <select
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50 font-medium"
              >
                <option value="bike">1. Bike / Motorcycle (1–30 kg)</option>
                <option value="moped_carrier">2. Moped / TVS XL Carrier (10–60 kg)</option>
                <option value="electric_scooter">3. Electric Cargo Scooter (5–40 kg)</option>
                <option value="auto_rickshaw">4. Auto Rickshaw (Goods) (30–150 kg)</option>
                <option value="electric_auto">5. Electric Cargo Auto (50–200 kg)</option>
                <option value="mini_three_wheeler">6. Mini Cargo 3-Wheeler (100–500 kg)</option>
                <option value="mini_pickup">7. Mini Pickup Truck (Tata Ace) (200+ kg)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-stone-700 font-semibold mb-1">
                Verified Payload Capacity (kg)
              </label>
              <input
                type="number"
                required
                min={1}
                max={5000}
                value={carryingCapacityKg}
                onChange={(e) => setCarryingCapacityKg(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="e.g. 60"
                className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50 font-bold"
              />
              <span className="text-[10px] text-stone-400 mt-0.5 block">
                Must be physically verified for legal goods-carriage
              </span>
            </div>

            <div>
              <label className="block text-stone-700 font-semibold mb-1">Pricing Model</label>
              <select
                value={pricingModel}
                onChange={(e) => setPricingModel(e.target.value)}
                className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50"
              >
                <option value="per_trip">Per Trip Flat Rate (₹ / trip)</option>
                <option value="per_km">Per Kilometre (₹ / km)</option>
                <option value="custom_quotation">Custom Quotation Required</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-stone-700 font-semibold mb-1">Base Rate (₹ INR)</label>
              <input
                type="number"
                required
                min={0}
                value={baseRate}
                onChange={(e) => setBaseRate(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="e.g. 180"
                className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50 font-bold text-emerald-800"
              />
            </div>

            <div>
              <label className="block text-stone-700 font-semibold mb-1">Additional Handling / Toll Fee (₹)</label>
              <input
                type="number"
                min={0}
                value={additionalCharges}
                onChange={(e) => setAdditionalCharges(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="e.g. 20"
                className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-stone-700 font-semibold mb-1">Base Station / Hub</label>
              <input
                type="text"
                value={town}
                onChange={(e) => setTown(e.target.value)}
                placeholder="e.g. Kinathukadavu Hub"
                className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50"
              />
            </div>

            <div>
              <label className="block text-stone-700 font-semibold mb-1">Service Routes (Comma separated)</label>
              <input
                type="text"
                value={serviceAreas}
                onChange={(e) => setServiceAreas(e.target.value)}
                placeholder="e.g. Coimbatore, Pollachi, Malumichampatti"
                className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-stone-700 font-semibold mb-1">Vehicle Description & Goods Safety Features</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Fitted with dual rear crate carriers and heavy-duty shock absorbers for fragile produce."
              className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors shadow-xs"
          >
            {submitting ? 'Registering Vehicle...' : 'Publish Vehicle to Transport Hub'}
          </button>
        </form>
      </Modal>

      {/* DRIVER ASSIGNMENT MODAL */}
      {activeRequest && driverModalOpen && (
        <Modal
          isOpen={driverModalOpen}
          onClose={() => setDriverModalOpen(false)}
          title={`Assign Driver for ${activeRequest.requesterName}`}
        >
          <form onSubmit={handleAssignDriver} className="space-y-4 text-xs">
            <div className="p-3 bg-stone-50 rounded-xl space-y-1">
              <div><strong>Pickup:</strong> {activeRequest.pickupAddress}</div>
              <div><strong>Destination:</strong> {activeRequest.deliveryAddress}</div>
              <div><strong>Cargo:</strong> {activeRequest.cargoType} ({activeRequest.cargoWeightKg || 50} kg)</div>
            </div>

            <div>
              <label className="block text-stone-700 font-semibold mb-1">Assigned Driver Name</label>
              <input
                type="text"
                required
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                placeholder="e.g. Senthil Kumar (Driver)"
                className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50 font-medium"
              />
            </div>

            <div>
              <label className="block text-stone-700 font-semibold mb-1">Driver Contact Phone</label>
              <input
                type="tel"
                required
                value={driverPhone}
                onChange={(e) => setDriverPhone(e.target.value)}
                placeholder="e.g. +91 94420 88912"
                className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50 font-medium"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-colors shadow-xs"
            >
              Confirm Driver & Notify Customer
            </button>
          </form>
        </Modal>
      )}

      {/* QUOTATION MODAL */}
      {activeRequest && quoteModalOpen && (
        <Modal
          isOpen={quoteModalOpen}
          onClose={() => setQuoteModalOpen(false)}
          title={`Quote Freight Price for ${activeRequest.requesterName}`}
        >
          <form onSubmit={handleSendQuote} className="space-y-4 text-xs">
            <div className="p-3 bg-stone-50 rounded-xl space-y-1">
              <div><strong>Route:</strong> {activeRequest.pickupAddress} → {activeRequest.deliveryAddress}</div>
              <div><strong>Cargo:</strong> {activeRequest.cargoType} ({activeRequest.cargoWeightKg || 50} kg)</div>
            </div>

            <div>
              <label className="block text-stone-700 font-semibold mb-1">Final Confirmed Quoted Rate (INR)</label>
              <input
                type="number"
                required
                min={1}
                value={quotedPrice}
                onChange={(e) => setQuotedPrice(Number(e.target.value))}
                placeholder="e.g. 1850"
                className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50 text-base font-bold text-emerald-800"
              />
            </div>

            <div>
              <label className="block text-stone-700 font-semibold mb-1">Notes / Terms</label>
              <input
                type="text"
                value={providerNotes}
                onChange={(e) => setProviderNotes(e.target.value)}
                placeholder="e.g. Includes toll charges and morning 6 AM loading."
                className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors shadow-xs"
            >
              Send Confirmed Quotation
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
};
