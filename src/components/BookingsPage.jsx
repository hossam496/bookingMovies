import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { bookingsPageStyles } from '../assets/dummyStyles';
import QRCode from 'qrcode';
import axios from 'axios';
import { Film, Clock, MapPin, QrCode, ChevronDown, X } from 'lucide-react';
import API_BASE from '../config';

function getStoredToken() {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("accessToken") ||
    null
  );
}

// دالة computeTotals المفقودة - أضفها هنا
function computeTotals(booking) {
  if (!booking || !booking.seats || !Array.isArray(booking.seats)) {
    return { seatCount: 0, subtotal: 0, total: 0 };
  }

  // إذا كان هناك amount محدد (مباشرة)
  if (booking.amount && typeof booking.amount === 'number' && booking.amount > 0) {
    const seatCount = booking.seats.length;
    return {
      seatCount,
      subtotal: booking.amount,
      total: booking.amount
    };
  }

  // حساب من seats array
  let subtotal = 0;
  const seatCount = booking.seats.length;

  booking.seats.forEach(seat => {
    if (seat && typeof seat === 'object') {
      // إذا كان السعر محدد في المقعد نفسه
      if (seat.price && typeof seat.price === 'number') {
        subtotal += seat.price;
      } else if (seat.type === 'recliner') {
        // سعر افتراضي للمقاعد الـ recliner
        subtotal += 300;
      } else {
        // سعر افتراضي للمقاعد العادية
        subtotal += 200;
      }
    }
  });

  // إذا كان subtotal صفراً ولكن booking.amountPaise موجود
  if (subtotal === 0 && booking.amountPaise) {
    subtotal = Number(booking.amountPaise) / 100;
  }

  return {
    seatCount,
    subtotal,
    total: subtotal // يمكن إضافة الضرائب هنا إذا لزم الأمر
  };
}

function BookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [qrs, setQrs] = useState({});
  const [expanded, setExpanded] = useState({});
  const [scannedDetails, setScannedDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // دوال مساعدة للتنسيق
  const formatTime = (time) => {
    if (!time) return "Time not specified";
    try {
      const date = new Date(time);
      if (isNaN(date.getTime())) return time;
      return date.toLocaleString('en-IN', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return time;
    }
  };

  const formatDuration = (minutes) => {
    if (!minutes) return "N/A";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  // fetch function
  useEffect(() => {
    let mounted = true;
    async function fetchMyBookings() {
      setLoading(true);
      setError('');

      try {
        const token = getStoredToken();
        if (!token) {
          navigate('/login');
          return;
        }

        let res;
        try {
          res = await axios.get(`${API_BASE}/api/bookings/my`, {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 15000
          });
        } catch (err) {
          res = await axios.get(`${API_BASE}/api/bookings`, {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 15000
          });
        }

        const data = res?.data || {};
        let items = [];
        if (Array.isArray(data)) items = data;
        else if (Array.isArray(data.items)) items = data.items;
        else if (Array.isArray(data.bookings)) items = data.bookings;
        else if (Array.isArray(data.data)) items = data.data;
        else if (data.item && Array.isArray(data.item)) items = data.item;
        else if (data.items && Array.isArray(data.items)) items = data.items;
        else if (data && data._id) items = [data];

        const normalized = items.map((b) => {
          const id = b._id || b.id || b.bookingId || String(b.id || "");
          const movie = b.movie || {};
          const title =
            movie.title || movie.name || b.movieName || b.title || "Untitled";
          const poster = movie.poster || b.poster || movie.image || "";
          const category = movie.category || b.category || "";
          const durationMins =
            movie.durationMins ?? movie.duration ?? b.durationMins ?? 0;
          const slotTime = b.showtime || b.slotTime || b.slot || null;
          const auditorium = b.auditorium || b.audi || "Audi 1";

          // seats: normalize string/object
          const seats =
            Array.isArray(b.seats) && b.seats.length
              ? b.seats.map((s) =>
                typeof s === "string"
                  ? { id: s }
                  : {
                    id: s.seatId || s.id || s.name || "",
                    type: s.type,
                    price:
                      typeof s.price === "number" ? s.price : undefined,
                  }
              )
              : [];

          // top-level amount in rupees if present
          let amount = 0;
          if (b.amountPaise !== undefined && b.amountPaise !== null) {
            amount = Number(b.amountPaise) / 100;
          } else if (typeof b.amount === "number") {
            amount = b.amount;
          } else if (typeof b.total === "number") {
            amount = b.total;
          }

          return {
            id,
            title,
            poster,
            category,
            durationMins,
            slotTime,
            auditorium,
            seats,
            amount,
            amountPaise: b.amountPaise,
            raw: b,
          };
        });

        if (mounted) setBookings(normalized);
      } catch (err) {
        console.error("Failed to load bookings:", err);
        const status = err?.response?.status;
        if (status === 401 || status === 403) {
          localStorage.removeItem("token");
          navigate("/login");
          return;
        }
        if (mounted) {
          setError(
            err?.response?.data?.message ||
            err.message ||
            "Failed to load bookings"
          );
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchMyBookings();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // generate QRs for current bookings
  useEffect(() => {
    let mounted = true;
    const makeQrs = async () => {
      const map = {};
      for (const b of bookings) {
        const seatsList = (b.seats || [])
          .map((s) => (typeof s === "string" ? s : s.id || ""))
          .filter(Boolean);
        const payload = JSON.stringify({
          bookingId: b.id,
          title: b.title,
          time: formatTime(b.slotTime),
          auditorium: b.auditorium,
          seats: seatsList,
        });
        try {
          const url = await QRCode.toDataURL(payload, {
            errorCorrectionLevel: "M",
            margin: 1,
            scale: 6,
          });
          map[b.id] = { url, payload };
        } catch (e) {
          console.error("QR error for", b.id, e);
          map[b.id] = { url: "", payload };
        }
      }
      if (mounted) setQrs(map);
    };
    if (bookings.length) makeQrs();
    return () => {
      mounted = false;
    };
  }, [bookings]);

  const toggle = (id) =>
    setExpanded((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));

  const handleQrScan = (bookingId) => {
    const entry = qrs[bookingId];
    if (!entry || !entry.payload) return;
    try {
      const parsed = JSON.parse(entry.payload);
      setExpanded((prev) => ({ ...prev, [bookingId]: true }));
      const el = document.getElementById(`booking-card-${bookingId}`);
      if (el && el.scrollIntoView)
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      setScannedDetails({ bookingId, ...parsed });
    } catch (e) {
      console.error("Failed to parse QR payload", e);
    }
  };

  const closeModal = () => setScannedDetails(null);

  return (
    <div className={bookingsPageStyles.pageContainer}>
      <div className={bookingsPageStyles.mainContainer}>
        <header className={bookingsPageStyles.header}>
          <h1 className={bookingsPageStyles.title}>Your Tickets</h1>
        </header>

        {loading && (
          <div className={bookingsPageStyles.loading}>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mr-3"></div>
            Loading Bookings...
          </div>
        )}

        {!loading && error && (
          <div className={bookingsPageStyles.error}>{error}</div>
        )}

        <div className={bookingsPageStyles.grid}>
          {bookings.length === 0 && !loading ? (
            <div className={bookingsPageStyles.noBookings}>
              <div className="text-4xl mb-4">🎬</div>
              <h3 className="text-xl font-bold mb-2">No Bookings Found</h3>
              <p className="text-gray-400 mb-4">You haven't booked any tickets yet.</p>
              <button
                onClick={() => navigate('/movies')}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
              >
                Browse Movies
              </button>
            </div>
          ) : (
            bookings.map((b) => {
              const totals = computeTotals(b);
              const isOpen = !!expanded[b.id];

              return (
                <article
                  id={`booking-card-${b.id}`}
                  key={b.id}
                  className={bookingsPageStyles.bookingCard}
                  aria-labelledby={`booking-${b.id}-title`}
                >
                  <div className={bookingsPageStyles.cardContent}>
                    <div className={bookingsPageStyles.posterContainer}>
                      {b.poster ? (
                        <img
                          src={b.poster}
                          alt={b.title}
                          className={bookingsPageStyles.poster}
                          onError={(e) => {
                            e.target.src = 'https://placehold.co/400x600?text=No+Poster';
                          }}
                        />
                      ) : (
                        <div className={bookingsPageStyles.posterPlaceholder}>
                          🎬
                        </div>
                      )}
                    </div>

                    <div className={bookingsPageStyles.cardInfo}>
                      <div className={bookingsPageStyles.cardHeader}>
                        <div>
                          <h2
                            id={`booking-${b.id}-title`}
                            className={bookingsPageStyles.movieTitle}
                          >
                            <Film className={bookingsPageStyles.movieIcon} />
                            <span>{b.title}</span>
                          </h2>

                          <div className={bookingsPageStyles.bookingId}>
                            Booking ID:{" "}
                            <span className={bookingsPageStyles.bookingIdText}>
                              {b.id.substring(0, 8)}...
                            </span>
                          </div>
                        </div>

                        <div className={bookingsPageStyles.category}>
                          <span className="px-3 py-1 bg-gray-800 text-gray-300 rounded-full text-sm">
                            {b.category || "Movie"}
                          </span>
                        </div>
                      </div>

                      <div className={bookingsPageStyles.details}>
                        <div className={bookingsPageStyles.timeContainer}>
                          <Clock className={bookingsPageStyles.timeIcon} />
                          <div>{formatTime(b.slotTime)}</div>
                        </div>

                        <div className={bookingsPageStyles.locationContainer}>
                          <MapPin className={bookingsPageStyles.locationIcon} />
                          <div className={bookingsPageStyles.locationText}>{b.auditorium}</div>
                        </div>
                      </div>

                      <div className={bookingsPageStyles.durationLabel}>Duration</div>
                      <div className={bookingsPageStyles.duration}>
                        {formatDuration(b.durationMins)}
                      </div>
                    </div>
                  </div>

                  <div className={bookingsPageStyles.summary}>
                    <div className={bookingsPageStyles.seatsLabel}>
                      Seats ({totals.seatCount})
                    </div>
                    <div className={bookingsPageStyles.total}>
                      ₹{totals.total.toLocaleString("en-IN")}
                    </div>
                  </div>

                  <div
                    className={`${bookingsPageStyles.expandedDetails} ${isOpen ? bookingsPageStyles.expandedOpen : bookingsPageStyles.expandedClosed
                      }`}
                    aria-hidden={!isOpen}
                  >
                    <div className={bookingsPageStyles.seatsSection}>
                      <div className={bookingsPageStyles.seatsLabelExpanded}>
                        Seats ({totals.seatCount})
                      </div>
                      <div className={bookingsPageStyles.seatsContainer}>
                        {(b.seats || []).map((s, index) => (
                          <div
                            key={s.id || index}
                            className={bookingsPageStyles.seatItem}
                          >
                            <div className={bookingsPageStyles.seatId}>
                              {(() => {
                                const val = typeof s === 'object' ? (s.id || s.seatId || s.seatNumber || s.name) : s;
                                return (val && val !== 'undefinedundefined') ? val : `Seat ${index + 1}`;
                              })()}
                            </div>
                            <div
                              className={`${bookingsPageStyles.seatType} ${s.type === "recliner"
                                  ? bookingsPageStyles.seatTypeRecliner
                                  : bookingsPageStyles.seatTypeStandard
                                }`}
                            >
                              {s.type === "recliner" ? "Recliner" : "Standard"}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className={bookingsPageStyles.pricing}>
                      <div className={bookingsPageStyles.subtotal}>
                        <div>Seats subtotal</div>
                        <div>₹{totals.subtotal.toLocaleString("en-IN")}</div>
                      </div>

                      <div className={bookingsPageStyles.finalTotal}>
                        <div>Total</div>
                        <div>₹{totals.total.toLocaleString("en-IN")}</div>
                      </div>
                    </div>

                    <div className={bookingsPageStyles.qrSection}>
                      <div className={bookingsPageStyles.qrLabel}>
                        <QrCode className={bookingsPageStyles.qrIcon} />
                        <div>Ticket QR</div>
                      </div>
                      <div className="ml-auto">
                        {qrs[b.id] && qrs[b.id].url ? (
                          <img
                            src={qrs[b.id].url}
                            alt={`${b.title} qr`}
                            className={bookingsPageStyles.qrImage}
                            role="button"
                            tabIndex={0}
                            onClick={() => handleQrScan(b.id)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleQrScan(b.id);
                            }}
                          />
                        ) : (
                          <div className={bookingsPageStyles.qrUnavailable}>
                            QR unavailable
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className={bookingsPageStyles.toggleButton}>
                    <button
                      onClick={() => toggle(b.id)}
                      aria-expanded={isOpen}
                      className={bookingsPageStyles.detailsButton}
                    >
                      <span>{isOpen ? "Hide details" : "View details"}</span>
                      <ChevronDown
                        className={`${bookingsPageStyles.chevron} ${isOpen ? bookingsPageStyles.chevronOpen : bookingsPageStyles.chevronClosed
                          }`}
                      />
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </div>

      {scannedDetails && (
        <div
          className={bookingsPageStyles.modalOverlay}
          aria-modal="true"
          role="dialog"
        >
          <div
            className={bookingsPageStyles.modalBackdrop}
            onClick={closeModal}
            aria-hidden="true"
          />
          <div className={bookingsPageStyles.modalContent}>
            <div className={bookingsPageStyles.modalHeader}>
              <div>
                <h3 className={bookingsPageStyles.modalTitle}>
                  {scannedDetails.title}
                </h3>
                <div className={bookingsPageStyles.modalBookingId}>
                  Booking ID:{" "}
                  <span className={bookingsPageStyles.modalIdText}>
                    {scannedDetails.bookingId}
                  </span>
                </div>
                <div className={bookingsPageStyles.modalDetails}>
                  <div>
                    <strong>Time:</strong> {scannedDetails.time}
                  </div>
                  <div>
                    <strong>Auditorium:</strong> {scannedDetails.auditorium}
                  </div>
                  <div className="mt-2">
                    <strong>Seats:</strong>{" "}
                    {Array.isArray(scannedDetails.seats)
                      ? scannedDetails.seats.join(", ")
                      : scannedDetails.seats}
                  </div>
                </div>
              </div>

              <button
                onClick={closeModal}
                className={bookingsPageStyles.modalCloseButton}
                aria-label="Close scanned details"
              >
                <X className={bookingsPageStyles.modalCloseIcon} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BookingsPage;