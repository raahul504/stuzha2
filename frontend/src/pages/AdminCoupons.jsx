import { useState, useEffect } from 'react';
import { couponService } from '../api/couponService';
import Navbar from '../components/Navbar';
import { showSuccess, showError } from '../utils/toast';
import { useNavigate } from 'react-router-dom';
import { formatIndianCurrency } from '../utils/currency';

export default function AdminCoupons() {
    const navigate = useNavigate();
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ code: '', discountType: 'PERCENTAGE', discountValue: '', maxUses: '', expiresAt: '', courseId: '' });

    const fetchCoupons = async () => {
        try {
            const data = await couponService.getAll();
            setCoupons(data.coupons);
        } catch {
            showError('Failed to load coupons');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchCoupons(); }, []);

    const handleCreate = async () => {
        try {
            await couponService.create({
                code: form.code,
                discountType: form.discountType,
                discountValue: parseFloat(form.discountValue),
                maxUses: form.maxUses ? parseInt(form.maxUses) : null,
                expiresAt: form.expiresAt ? new Date(form.expiresAt + 'T23:59:59').toISOString() : null,
                courseId: form.courseId || null,
            });
            showSuccess('Coupon created!');
            setShowForm(false);
            setForm({ code: '', discountType: 'PERCENTAGE', discountValue: '', maxUses: '', expiresAt: '', courseId: '' });
            fetchCoupons();
        } catch (err) {
            showError(err.response?.data?.error?.message || 'Failed to create coupon');
        }
    };

    const handleToggle = async (coupon) => {
        try {
            await couponService.update(coupon.id, { isActive: !coupon.isActive });
            showSuccess(`Coupon ${coupon.isActive ? 'deactivated' : 'activated'}`);
            fetchCoupons();
        } catch {
            showError('Failed to update coupon');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this coupon?')) return;
        try {
            await couponService.delete(id);
            showSuccess('Coupon deleted');
            fetchCoupons();
        } catch {
            showError('Failed to delete coupon');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-dcs-black via-dcs-black to-dcs-dark-gray/30">
            <Navbar />
            <div className="max-w-6xl mx-auto px-6 pt-24 pb-12">
                <button
                    onClick={() => navigate('/admin')}
                    className="flex items-center gap-2 text-dcs-text-gray hover:text-white transition-colors mb-4 group"
                >
                    <svg className="w-5 h-5 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                    </svg>
                    Back to Dashboard
                </button>
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-dcs-purple bg-clip-text text-transparent">Coupon Manager</h1>
                        <p className="text-dcs-text-gray mt-1">Create and manage discount coupons</p>
                    </div>
                    <button onClick={() => setShowForm(!showForm)} className="px-6 py-3 bg-gradient-to-r from-dcs-purple to-dcs-electric-indigo text-white rounded-xl font-semibold hover:opacity-90 transition-all">
                        {showForm ? 'Cancel' : '+ New Coupon'}
                    </button>
                </div>

                {showForm && (
                    <div className="mb-8 p-6 bg-dcs-dark-gray border border-dcs-purple/20 rounded-2xl">
                        <h2 className="text-xl font-bold text-white mb-4">Create Coupon</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-dcs-text-gray text-sm mb-1 block">Code</label>
                                <input value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} className="w-full px-4 py-2 bg-dcs-black border border-white/10 rounded-lg text-white focus:border-dcs-purple focus:outline-none" placeholder="SUMMER20" />
                            </div>
                            <div>
                                <label className="text-dcs-text-gray text-sm mb-1 block">Discount Type</label>
                                <select value={form.discountType} onChange={e => setForm({ ...form, discountType: e.target.value })} className="w-full px-4 py-2 bg-dcs-black border border-white/10 rounded-lg text-white focus:border-dcs-purple focus:outline-none">
                                    <option value="PERCENTAGE">Percentage (%)</option>
                                    <option value="FIXED">Fixed Amount ($)</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-dcs-text-gray text-sm mb-1 block">Discount Value</label>
                                <input type="text" inputMode="decimal" pattern="[0-9]*\.?[0-9]{0,2}" value={form.discountValue} onChange={e => setForm({ ...form, discountValue: e.target.value })} className="w-full px-4 py-2 bg-dcs-black border border-white/10 rounded-lg text-white focus:border-dcs-purple focus:outline-none" placeholder={form.discountType === 'PERCENTAGE' ? '20' : '10'} />
                            </div>
                            <div>
                                <label className="text-dcs-text-gray text-sm mb-1 block">Max Uses (leave blank for unlimited)</label>
                                <input type="number" value={form.maxUses} onChange={e => setForm({ ...form, maxUses: e.target.value })} className="w-full px-4 py-2 bg-dcs-black border border-white/10 rounded-lg text-white focus:border-dcs-purple focus:outline-none" placeholder="100" />
                            </div>
                            <div>
                                <label className="text-dcs-text-gray text-sm mb-1 block">Expiry Date (leave blank for no expiry)</label>
                                <input type="date" value={form.expiresAt} onChange={e => setForm({ ...form, expiresAt: e.target.value })} className="w-full px-4 py-2 bg-dcs-black border border-white/10 rounded-lg text-white focus:border-dcs-purple focus:outline-none" />
                            </div>
                            <div>
                                <label className="text-dcs-text-gray text-sm mb-1 block">Course ID (leave blank for all courses)</label>
                                <input value={form.courseId} onChange={e => setForm({ ...form, courseId: e.target.value })} className="w-full px-4 py-2 bg-dcs-black border border-white/10 rounded-lg text-white focus:border-dcs-purple focus:outline-none" placeholder="Optional" />
                            </div>
                        </div>
                        <button onClick={handleCreate} className="mt-4 px-6 py-3 bg-gradient-to-r from-dcs-purple to-dcs-electric-indigo text-white rounded-xl font-semibold hover:opacity-90 transition-all">
                            Create Coupon
                        </button>
                    </div>
                )}

                {loading ? (
                    <p className="text-dcs-text-gray">Loading...</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-white/10 text-dcs-text-gray text-sm">
                                    <th className="pb-3 pr-4">Code</th>
                                    <th className="pb-3 pr-4">Discount</th>
                                    <th className="pb-3 pr-4">Uses</th>
                                    <th className="pb-3 pr-4">Expires</th>
                                    <th className="pb-3 pr-4">Course</th>
                                    <th className="pb-3 pr-4">Status</th>
                                    <th className="pb-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {coupons.map(coupon => (
                                    <tr key={coupon.id} className="border-b border-white/5 text-sm">
                                        <td className="py-3 pr-4 font-mono text-dcs-purple font-bold">{coupon.code}</td>
                                        <td className="py-3 pr-4 text-white">
                                            {coupon.discountType === 'PERCENTAGE' ? `${coupon.discountValue}%` : `₹${formatIndianCurrency(coupon.discountValue)}`}
                                        </td>
                                        <td className="py-3 pr-4 text-dcs-text-gray">
                                            {coupon.usedCount}{coupon.maxUses ? `/${coupon.maxUses}` : ' / ∞'}
                                        </td>
                                        <td className="py-3 pr-4 text-dcs-text-gray">
                                            {coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString() : 'Never'}
                                        </td>
                                        <td className="py-3 pr-4 text-dcs-text-gray">
                                            {coupon.course?.title || 'All courses'}
                                        </td>
                                        <td className="py-3 pr-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${coupon.isActive ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                                {coupon.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="py-3 flex gap-2">
                                            <button onClick={() => handleToggle(coupon)} className="px-3 py-1 text-xs bg-dcs-dark-gray border border-white/10 text-white rounded-lg hover:border-dcs-purple transition-colors">
                                                {coupon.isActive ? 'Deactivate' : 'Activate'}
                                            </button>
                                            <button onClick={() => handleDelete(coupon.id)} className="px-3 py-1 text-xs bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors">
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {coupons.length === 0 && <p className="text-dcs-text-gray text-center py-8">No coupons yet.</p>}
                    </div>
                )}
            </div>
        </div>
    );
}