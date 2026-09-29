import React, { useEffect, useMemo, useState } from "react";

import {
  collection,
  addDoc,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";

import QRCode from "qrcode";
import { Html5QrcodeScanner } from "html5-qrcode";

import { auth, db } from "./firebase";

const RSVP = {
  GOING: "GOING",
  MAYBE: "MAYBE",
  NOT_GOING: "NOT_GOING",
};

const EVENT_QR_PREFIX = "EVENTHUB_EVENT:";
const CHECKIN_QR_PREFIX = "EVENTHUB_CHECKIN:";

function App() {
  // =========================================================
  // AUTH
  // =========================================================

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  const [authMode, setAuthMode] = useState("login");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("attendee");

  const [loading, setLoading] = useState(true);

  // =========================================================
  // DATA
  // =========================================================

  const [events, setEvents] = useState([]);
  const [rsvps, setRsvps] = useState([]);
  const [waitlist, setWaitlist] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [checkins, setCheckins] = useState([]);

  // =========================================================
  // UI
  // =========================================================

  const [selectedEvent, setSelectedEvent] = useState(null);
  const [activeTab, setActiveTab] = useState("events");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [showQR, setShowQR] = useState(false);
  const [qrImage, setQrImage] = useState("");

  const [showScanner, setShowScanner] = useState(false);
  const [scannerType, setScannerType] = useState("event");

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  // =========================================================
  // EVENT FORM
  // =========================================================

  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventCapacity, setEventCapacity] = useState("");
  const [eventCategory, setEventCategory] = useState("Workshop");

  const [creatingEvent, setCreatingEvent] = useState(false);

  // =========================================================
  // ANNOUNCEMENT FORM
  // =========================================================

  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementMessage, setAnnouncementMessage] = useState("");

  // =========================================================
  // AUTH LISTENER
  // =========================================================

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);

      if (!currentUser) {
        setProfile(null);
        setLoading(false);
        return;
      }

      const unsubscribeProfile = onSnapshot(
        doc(db, "users", currentUser.uid),
        (snapshot) => {
          if (snapshot.exists()) {
            setProfile(snapshot.data());
          } else {
            setProfile({
              name: currentUser.email,
              email: currentUser.email,
              role: "attendee",
            });
          }

          setLoading(false);
        },
        (err) => {
          console.error(err);
          setLoading(false);
        }
      );

      return unsubscribeProfile;
    });

    return () => unsubscribe();
  }, []);

  // =========================================================
  // EVENTS REAL TIME
  // =========================================================

  useEffect(() => {
    if (!user) {
      setEvents([]);
      return;
    }

    const unsubscribe = onSnapshot(
      collection(db, "events"),
      (snapshot) => {
        const data = snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        }));

        data.sort((a, b) => {
          const aValue = `${a.date || ""} ${a.time || ""}`;
          const bValue = `${b.date || ""} ${b.time || ""}`;

          return aValue.localeCompare(bValue);
        });

        setEvents(data);
      },
      (err) => {
        console.error("Events:", err);
        setError("Unable to load events.");
      }
    );

    return () => unsubscribe();
  }, [user]);

  // =========================================================
  // RSVP REAL TIME
  // =========================================================

  useEffect(() => {
    if (!user) {
      setRsvps([]);
      return;
    }

    const unsubscribe = onSnapshot(
      collection(db, "rsvps"),
      (snapshot) => {
        const data = snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        }));

        setRsvps(data);
      },
      (err) => {
        console.error("RSVP:", err);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // =========================================================
  // WAITLIST REAL TIME
  // =========================================================

  useEffect(() => {
    if (!user) {
      setWaitlist([]);
      return;
    }

    const unsubscribe = onSnapshot(
      collection(db, "waitlist"),
      (snapshot) => {
        const data = snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        }));

        setWaitlist(data);
      },
      (err) => {
        console.error("Waitlist:", err);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // =========================================================
  // ANNOUNCEMENTS REAL TIME
  // =========================================================

  useEffect(() => {
    if (!user) {
      setAnnouncements([]);
      return;
    }

    const unsubscribe = onSnapshot(
      collection(db, "announcements"),
      (snapshot) => {
        const data = snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        }));

        data.sort((a, b) => {
          const aTime = a.createdAt?.seconds || 0;
          const bTime = b.createdAt?.seconds || 0;

          return bTime - aTime;
        });

        setAnnouncements(data);
      },
      (err) => {
        console.error("Announcements:", err);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // =========================================================
  // NOTIFICATIONS REAL TIME
  // =========================================================

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    const unsubscribe = onSnapshot(
      collection(db, "notifications"),
      (snapshot) => {
        const data = snapshot.docs
          .map((item) => ({
            id: item.id,
            ...item.data(),
          }))
          .filter((item) => item.userId === user.uid);

        data.sort((a, b) => {
          const aTime = a.createdAt?.seconds || 0;
          const bTime = b.createdAt?.seconds || 0;

          return bTime - aTime;
        });

        setNotifications(data);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // =========================================================
  // CHECKINS REAL TIME
  // =========================================================

  useEffect(() => {
    if (!user) {
      setCheckins([]);
      return;
    }

    const unsubscribe = onSnapshot(
      collection(db, "checkins"),
      (snapshot) => {
        const data = snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        }));

        setCheckins(data);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // =========================================================
  // AUTH
  // =========================================================

  const handleAuth = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");

    try {
      if (!email || !password) {
        setError("Please enter email and password.");
        return;
      }

      if (authMode === "register") {
        if (!name.trim()) {
          setError("Please enter your name.");
          return;
        }

        const result =
          await createUserWithEmailAndPassword(
            auth,
            email.trim(),
            password
          );

        await setDoc(
          doc(db, "users", result.user.uid),
          {
            name: name.trim(),
            email: email.trim().toLowerCase(),
            role,
            createdAt: serverTimestamp(),
          }
        );

        setMessage("Account created successfully.");
      } else {
        await signInWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );

        setMessage("Login successful.");
      }

      setPassword("");
    } catch (err) {
      console.error(err);

      if (err.code === "auth/email-already-in-use") {
        setError("This email is already registered.");
      } else if (err.code === "auth/invalid-email") {
        setError("Invalid email address.");
      } else if (
        err.code === "auth/invalid-credential"
      ) {
        setError("Invalid email or password.");
      } else if (err.code === "auth/weak-password") {
        setError("Password must contain at least 6 characters.");
      } else {
        setError(err.message);
      }
    }
  };

  const logout = async () => {
    await signOut(auth);
    setSelectedEvent(null);
    setActiveTab("events");
  };

  // =========================================================
  // CREATE EVENT
  // =========================================================

  const createEvent = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");

    if (profile?.role !== "organizer") {
      setError("Only organizers can create events.");
      return;
    }

    if (
      !eventTitle.trim() ||
      !eventDate ||
      !eventTime ||
      !eventLocation.trim() ||
      !eventCapacity
    ) {
      setError("Please complete all required fields.");
      return;
    }

    const capacity = Number(eventCapacity);

    if (capacity <= 0) {
      setError("Capacity must be greater than 0.");
      return;
    }

    try {
      setCreatingEvent(true);

      await addDoc(collection(db, "events"), {
        title: eventTitle.trim(),
        description: eventDescription.trim(),
        date: eventDate,
        time: eventTime,
        location: eventLocation.trim(),
        capacity,
        category: eventCategory,
        status: "PUBLISHED",

        organizerId: user.uid,
        organizerName: profile?.name || user.email,
        organizerEmail: user.email,

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setEventTitle("");
      setEventDescription("");
      setEventDate("");
      setEventTime("");
      setEventLocation("");
      setEventCapacity("");
      setEventCategory("Workshop");

      setMessage("Event published successfully.");
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setCreatingEvent(false);
    }
  };

  // =========================================================
  // RSVP
  // =========================================================

  const getUserRSVP = (eventId) => {
    return rsvps.find(
      (r) =>
        r.eventId === eventId &&
        r.userId === user.uid
    );
  };

  const getEventRSVPs = (eventId) => {
    return rsvps.filter((r) => r.eventId === eventId);
  };

  const getGoing = (eventId) => {
    return getEventRSVPs(eventId).filter(
      (r) => r.status === RSVP.GOING
    ).length;
  };

  const getMaybe = (eventId) => {
    return getEventRSVPs(eventId).filter(
      (r) => r.status === RSVP.MAYBE
    ).length;
  };

  const getNotGoing = (eventId) => {
    return getEventRSVPs(eventId).filter(
      (r) => r.status === RSVP.NOT_GOING
    ).length;
  };

  const getWaitlisted = (eventId) => {
    return waitlist
      .filter(
        (w) =>
          w.eventId === eventId &&
          w.status === "WAITING"
      )
      .sort(
        (a, b) =>
          (a.joinedAt?.seconds || 0) -
          (b.joinedAt?.seconds || 0)
      );
  };

  const submitRSVP = async (event, status) => {
    setError("");
    setMessage("");

    try {
      const existing = getUserRSVP(event.id);

      const going = getGoing(event.id);
      const capacity = Number(event.capacity || 0);

      // -----------------------------------------------------
      // FULL EVENT
      // -----------------------------------------------------

      if (
        status === RSVP.GOING &&
        existing?.status !== RSVP.GOING &&
        going >= capacity
      ) {
        const existingWaitlist = waitlist.find(
          (w) =>
            w.eventId === event.id &&
            w.userId === user.uid &&
            w.status === "WAITING"
        );

        if (!existingWaitlist) {
          await setDoc(
            doc(
              db,
              "waitlist",
              `${event.id}_${user.uid}`
            ),
            {
              eventId: event.id,
              userId: user.uid,
              userName:
                profile?.name || user.email,
              userEmail: user.email,
              status: "WAITING",
              joinedAt: serverTimestamp(),
            }
          );

          await createNotification(
            user.uid,
            event.id,
            "WAITLIST",
            `You joined the waitlist for ${event.title}.`
          );

          setMessage(
            "Event is full. You have been added to the waitlist."
          );
        } else {
          setMessage(
            "You are already on the waitlist."
          );
        }

        return;
      }

      // -----------------------------------------------------
      // RSVP DOCUMENT
      // -----------------------------------------------------

      const rsvpId = `${event.id}_${user.uid}`;

      await setDoc(
        doc(db, "rsvps", rsvpId),
        {
          eventId: event.id,
          userId: user.uid,
          userName: profile?.name || user.email,
          userEmail: user.email,
          status,
          updatedAt: serverTimestamp(),
          respondedAt:
            existing?.respondedAt ||
            serverTimestamp(),
        },
        { merge: true }
      );

      // Remove waitlist if user gets a normal RSVP.
      const waitlistId = `${event.id}_${user.uid}`;

      const myWaitlist = waitlist.find(
        (w) =>
          w.id === waitlistId &&
          w.status === "WAITING"
      );

      if (myWaitlist) {
        await deleteDoc(
          doc(db, "waitlist", waitlistId)
        );
      }

      await createNotification(
        user.uid,
        event.id,
        "RSVP",
        `Your RSVP for ${event.title} is ${status}.`
      );

      setMessage(
        status === RSVP.GOING
          ? "Your RSVP is confirmed as GOING."
          : status === RSVP.MAYBE
          ? "Your RSVP is saved as MAYBE."
          : "Your RSVP is saved as NOT GOING."
      );
    } catch (err) {
      console.error(err);
      setError(
        "Unable to save RSVP. Please try again."
      );
    }
  };

  // =========================================================
  // CANCEL RSVP
  // =========================================================

  const cancelRSVP = async (event) => {
    try {
      const id = `${event.id}_${user.uid}`;

      await deleteDoc(doc(db, "rsvps", id));

      await createNotification(
        user.uid,
        event.id,
        "RSVP_CANCELLED",
        `Your RSVP for ${event.title} was cancelled.`
      );

      setMessage("RSVP cancelled.");
    } catch (err) {
      console.error(err);
      setError("Unable to cancel RSVP.");
    }
  };

  // =========================================================
  // WAITLIST
  // =========================================================

  const leaveWaitlist = async (event) => {
    try {
      const id = `${event.id}_${user.uid}`;

      await deleteDoc(doc(db, "waitlist", id));

      setMessage("You left the waitlist.");
    } catch (err) {
      console.error(err);
      setError("Unable to leave waitlist.");
    }
  };

  // =========================================================
  // NOTIFICATIONS
  // =========================================================

  const createNotification = async (
    userId,
    eventId,
    type,
    text
  ) => {
    await addDoc(collection(db, "notifications"), {
      userId,
      eventId,
      type,
      message: text,
      read: false,
      createdAt: serverTimestamp(),
    });
  };

  const markNotificationRead = async (
    notification
  ) => {
    await setDoc(
      doc(db, "notifications", notification.id),
      {
        read: true,
      },
      { merge: true }
    );
  };

  // =========================================================
  // ANNOUNCEMENTS
  // =========================================================

  const createAnnouncement = async (event) => {
    if (
      !announcementTitle.trim() ||
      !announcementMessage.trim()
    ) {
      setError("Enter announcement title and message.");
      return;
    }

    try {
      await addDoc(
        collection(db, "announcements"),
        {
          eventId: event.id,
          organizerId: user.uid,
          title: announcementTitle.trim(),
          message: announcementMessage.trim(),
          createdAt: serverTimestamp(),
        }
      );

      // Notify all users who RSVP'ed to this event.
      const eventUsers = getEventRSVPs(event.id);

      for (const rsvp of eventUsers) {
        await createNotification(
          rsvp.userId,
          event.id,
          "ANNOUNCEMENT",
          announcementTitle.trim()
        );
      }

      setAnnouncementTitle("");
      setAnnouncementMessage("");

      setMessage(
        "Announcement published successfully."
      );
    } catch (err) {
      console.error(err);
      setError("Unable to publish announcement.");
    }
  };

  // =========================================================
  // QR CODE GENERATION
  // =========================================================

  const generateEventQR = async (event) => {
    try {
      const payload =
        `${EVENT_QR_PREFIX}${event.id}`;

      const image = await QRCode.toDataURL(
        payload,
        {
          width: 500,
          margin: 2,
        }
      );

      setQrImage(image);
      setScannerType("event");
      setShowQR(true);
    } catch (err) {
      console.error(err);
      setError("Unable to generate QR code.");
    }
  };

  const generateCheckinQR = async (event) => {
    try {
      const payload =
        `${CHECKIN_QR_PREFIX}${event.id}:${user.uid}`;

      const image = await QRCode.toDataURL(
        payload,
        {
          width: 500,
          margin: 2,
        }
      );

      setQrImage(image);
      setScannerType("checkin");
      setShowQR(true);
    } catch (err) {
      console.error(err);
      setError("Unable to generate check-in QR.");
    }
  };

  // =========================================================
  // QR SCANNER
  // =========================================================

  useEffect(() => {
    if (!showScanner) return;

    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      {
        fps: 10,
        qrbox: {
          width: 250,
          height: 250,
        },
      },
      false
    );

    scanner.render(
      async (decodedText) => {
        try {
          // -----------------------------------------------
          // EVENT QR
          // -----------------------------------------------

          if (
            decodedText.startsWith(
              EVENT_QR_PREFIX
            )
          ) {
            const eventId =
              decodedText.replace(
                EVENT_QR_PREFIX,
                ""
              );

            const found = events.find(
              (e) => e.id === eventId
            );

            if (found) {
              setSelectedEvent(found);
              setShowScanner(false);
              setMessage(
                "Event QR scanned successfully."
              );
            } else {
              setError(
                "Event was not found."
              );
            }
          }

          // -----------------------------------------------
          // CHECK-IN QR
          // -----------------------------------------------

          if (
            decodedText.startsWith(
              CHECKIN_QR_PREFIX
            )
          ) {
            const value =
              decodedText.replace(
                CHECKIN_QR_PREFIX,
                ""
              );

            const [eventId, attendeeId] =
              value.split(":");

            const event = events.find(
              (e) => e.id === eventId
            );

            if (!event) {
              setError("Event not found.");
              return;
            }

            if (
              event.organizerId !== user.uid
            ) {
              setError(
                "Only the event organizer can check in attendees."
              );
              return;
            }

            const attendeeRSVP =
              rsvps.find(
                (r) =>
                  r.eventId === eventId &&
                  r.userId === attendeeId &&
                  r.status === RSVP.GOING
              );

            if (!attendeeRSVP) {
              setError(
                "Attendee does not have a GOING RSVP."
              );
              return;
            }

            const checkinId =
              `${eventId}_${attendeeId}`;

            await setDoc(
              doc(
                db,
                "checkins",
                checkinId
              ),
              {
                eventId,
                attendeeId,
                attendeeName:
                  attendeeRSVP.userName,
                attendeeEmail:
                  attendeeRSVP.userEmail,
                checkedInBy: user.uid,
                checkedInAt:
                  serverTimestamp(),
              }
            );

            setShowScanner(false);

            setMessage(
              `${attendeeRSVP.userName} checked in successfully.`
            );
          }
        } catch (err) {
          console.error(err);
          setError(
            "Unable to process QR code."
          );
        }
      },
      () => {}
    );

    return () => {
      scanner
        .clear()
        .catch(() => {});
    };
  }, [
    showScanner,
    events,
    rsvps,
    user,
  ]);

  // =========================================================
  // DELETE EVENT
  // =========================================================

  const deleteEvent = async (event) => {
    if (event.organizerId !== user.uid) {
      setError(
        "You can only delete your own events."
      );
      return;
    }

    if (
      !window.confirm(
        `Delete "${event.title}"?`
      )
    ) {
      return;
    }

    try {
      await deleteDoc(
        doc(db, "events", event.id)
      );

      setSelectedEvent(null);
      setMessage(
        "Event deleted successfully."
      );
    } catch (err) {
      console.error(err);
      setError("Unable to delete event.");
    }
  };

  // =========================================================
  // SEARCH
  // =========================================================

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const text =
        `${event.title} ${event.description} ${event.location} ${event.category}`
          .toLowerCase();

      const matchesSearch =
        text.includes(
          search.toLowerCase()
        );

      const matchesCategory =
        categoryFilter === "ALL" ||
        event.category === categoryFilter;

      return (
        matchesSearch &&
        matchesCategory &&
        event.status !== "CANCELLED"
      );
    });
  }, [
    events,
    search,
    categoryFilter,
  ]);

  // =========================================================
  // ANALYTICS
  // =========================================================

  const getEventAnalytics = (eventId) => {
    const eventRSVPs =
      getEventRSVPs(eventId);

    const going = eventRSVPs.filter(
      (r) => r.status === RSVP.GOING
    ).length;

    const maybe = eventRSVPs.filter(
      (r) => r.status === RSVP.MAYBE
    ).length;

    const notGoing = eventRSVPs.filter(
      (r) => r.status === RSVP.NOT_GOING
    ).length;

    const event =
      events.find((e) => e.id === eventId);

    const capacity = Number(
      event?.capacity || 0
    );

    const total =
      going + maybe + notGoing;

    const responseRate =
      capacity > 0
        ? Math.min(
            ((going + maybe) /
              capacity) *
              100,
            100
          )
        : 0;

    const utilization =
      capacity > 0
        ? Math.min(
            (going / capacity) * 100,
            100
          )
        : 0;

    return {
      going,
      maybe,
      notGoing,
      total,
      capacity,
      responseRate,
      utilization,
      waitlist:
        getWaitlisted(eventId).length,
    };
  };

  // =========================================================
  // MY RSVPS
  // =========================================================

  const myRSVPs = useMemo(() => {
    return rsvps.filter(
      (r) => r.userId === user?.uid
    );
  }, [rsvps, user]);

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-card">
          <div className="spinner"></div>
          <h2>Loading EventHub...</h2>
          <p>Connecting to Firebase Cloud</p>
        </div>
      </div>
    );
  }

  // =========================================================
  // AUTH SCREEN
  // =========================================================

  if (!user) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="brand">
            <div className="brand-icon">
              ☁
            </div>

            <div>
              <h1>EventHub</h1>
              <p>
                Real-Time Cloud Event Platform
              </p>
            </div>
          </div>

          <div className="auth-heading">
            <h2>
              {authMode === "login"
                ? "Welcome Back"
                : "Create Account"}
            </h2>

            <p>
              {authMode === "login"
                ? "Manage events and RSVPs."
                : "Create your EventHub account."}
            </p>
          </div>

          {error && (
            <div className="alert error">
              {error}
            </div>
          )}

          {message && (
            <div className="alert success">
              {message}
            </div>
          )}

          <form onSubmit={handleAuth}>
            {authMode === "register" && (
              <div className="form-group">
                <label>Full Name</label>

                <input
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                  placeholder="Enter your name"
                />
              </div>
            )}

            <div className="form-group">
              <label>Email</label>

              <input
                type="email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                placeholder="you@example.com"
              />
            </div>

            <div className="form-group">
              <label>Password</label>

              <input
                type="password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                placeholder="Minimum 6 characters"
              />
            </div>

            {authMode === "register" && (
              <div className="form-group">
                <label>Role</label>

                <select
                  value={role}
                  onChange={(e) =>
                    setRole(e.target.value)
                  }
                >
                  <option value="attendee">
                    Attendee
                  </option>

                  <option value="organizer">
                    Organizer
                  </option>
                </select>
              </div>
            )}

            <button
              className="primary-btn full-width"
              type="submit"
            >
              {authMode === "login"
                ? "Login"
                : "Create Account"}
            </button>
          </form>

          <div className="auth-switch">
            {authMode === "login" ? (
              <>
                Don't have an account?

                <button
                  onClick={() =>
                    setAuthMode("register")
                  }
                >
                  Create Account
                </button>
              </>
            ) : (
              <>
                Already have an account?

                <button
                  onClick={() =>
                    setAuthMode("login")
                  }
                >
                  Login
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // EVENT DETAILS
  // =========================================================

  if (selectedEvent) {
    const event = selectedEvent;

    const analytics =
      getEventAnalytics(event.id);

    const myRSVP =
      getUserRSVP(event.id);

    const myWaitlist =
      waitlist.find(
        (w) =>
          w.eventId === event.id &&
          w.userId === user.uid &&
          w.status === "WAITING"
      );

    const eventAnnouncements =
      announcements.filter(
        (a) => a.eventId === event.id
      );

    const eventCheckins =
      checkins.filter(
        (c) => c.eventId === event.id
      );

    const isOwner =
      event.organizerId === user.uid;

    return (
      <div className="app">
        <header className="topbar">
          <div className="brand">
            <div className="brand-icon">
              ☁
            </div>

            <div>
              <h1>EventHub</h1>
              <span>
                Cloud Event Platform
              </span>
            </div>
          </div>

          <div className="topbar-right">
            <span>
              {profile?.name ||
                user.email}
            </span>

            <button
              className="logout-btn"
              onClick={logout}
            >
              Logout
            </button>
          </div>
        </header>

        <main className="main-container">
          <button
            className="back-btn"
            onClick={() =>
              setSelectedEvent(null)
            }
          >
            ← Back to Dashboard
          </button>

          {error && (
            <div className="alert error">
              {error}
            </div>
          )}

          {message && (
            <div className="alert success">
              {message}
            </div>
          )}

          <section className="event-detail-card">
            <div className="event-detail-header">
              <div>
                <span className="event-status">
                  {event.status}
                </span>

                <h1>{event.title}</h1>

                <p className="event-description">
                  {event.description ||
                    "No description available."}
                </p>
              </div>
            </div>

            <div className="event-info-grid">
              <div className="info-box">
                <span>📅</span>

                <div>
                  <small>Date</small>
                  <strong>
                    {event.date}
                  </strong>
                </div>
              </div>

              <div className="info-box">
                <span>⏰</span>

                <div>
                  <small>Time</small>
                  <strong>
                    {event.time}
                  </strong>
                </div>
              </div>

              <div className="info-box">
                <span>📍</span>

                <div>
                  <small>Location</small>
                  <strong>
                    {event.location}
                  </strong>
                </div>
              </div>

              <div className="info-box">
                <span>👥</span>

                <div>
                  <small>Capacity</small>
                  <strong>
                    {event.capacity}
                  </strong>
                </div>
              </div>
            </div>

            {/* RSVP */}
            {!isOwner && (
              <div className="rsvp-section">
                <div className="section-title">
                  <div>
                    <h2>
                      RSVP to Event
                    </h2>

                    <p>
                      Select your attendance
                      status.
                    </p>
                  </div>

                  {myRSVP && (
                    <span className="current-rsvp">
                      Your RSVP:{" "}
                      <strong>
                        {myRSVP.status}
                      </strong>
                    </span>
                  )}
                </div>

                <div className="rsvp-buttons">
                  <button
                    className={`rsvp-btn going ${
                      myRSVP?.status ===
                      RSVP.GOING
                        ? "active"
                        : ""
                    }`}
                    onClick={() =>
                      submitRSVP(
                        event,
                        RSVP.GOING
                      )
                    }
                  >
                    ✓ GOING
                  </button>

                  <button
                    className={`rsvp-btn maybe ${
                      myRSVP?.status ===
                      RSVP.MAYBE
                        ? "active"
                        : ""
                    }`}
                    onClick={() =>
                      submitRSVP(
                        event,
                        RSVP.MAYBE
                      )
                    }
                  >
                    ? MAYBE
                  </button>

                  <button
                    className={`rsvp-btn not-going ${
                      myRSVP?.status ===
                      RSVP.NOT_GOING
                        ? "active"
                        : ""
                    }`}
                    onClick={() =>
                      submitRSVP(
                        event,
                        RSVP.NOT_GOING
                      )
                    }
                  >
                    ✕ NOT GOING
                  </button>
                </div>

                {myRSVP && (
                  <button
                    className="cancel-rsvp-btn"
                    onClick={() =>
                      cancelRSVP(event)
                    }
                  >
                    Cancel RSVP
                  </button>
                )}

                {myWaitlist && (
                  <div className="waitlist-box">
                    <strong>
                      ⏳ You are on the
                      waitlist
                    </strong>

                    <p>
                      Position:{" "}
                      {
                        getWaitlisted(
                          event.id
                        ).findIndex(
                          (w) =>
                            w.userId ===
                            user.uid
                        ) + 1
                      }
                    </p>

                    <button
                      className="cancel-rsvp-btn"
                      onClick={() =>
                        leaveWaitlist(
                          event
                        )
                      }
                    >
                      Leave Waitlist
                    </button>
                  </div>
                )}

                {myRSVP?.status ===
                  RSVP.GOING && (
                  <div className="checkin-personal">
                    <button
                      className="secondary-btn"
                      onClick={() =>
                        generateCheckinQR(
                          event
                        )
                      }
                    >
                      🎟 Show My Check-in QR
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ANALYTICS */}
            <div className="live-rsvp-card">
              <div className="section-title">
                <div>
                  <h2>
                    Live Event Analytics
                  </h2>

                  <p>
                    Firestore real-time
                    updates
                  </p>
                </div>

                <span className="live-badge">
                  ● LIVE
                </span>
              </div>

              <div className="rsvp-stats">
                <div className="rsvp-stat going-stat">
                  <span>✓</span>
                  <strong>
                    {analytics.going}
                  </strong>
                  <small>
                    Going
                  </small>
                </div>

                <div className="rsvp-stat maybe-stat">
                  <span>?</span>
                  <strong>
                    {analytics.maybe}
                  </strong>
                  <small>
                    Maybe
                  </small>
                </div>

                <div className="rsvp-stat not-going-stat">
                  <span>×</span>
                  <strong>
                    {analytics.notGoing}
                  </strong>
                  <small>
                    Not Going
                  </small>
                </div>

                <div className="rsvp-stat wait-stat">
                  <span>⏳</span>
                  <strong>
                    {analytics.waitlist}
                  </strong>
                  <small>
                    Waitlist
                  </small>
                </div>
              </div>

              <div className="capacity-area">
                <div className="capacity-label">
                  <span>
                    Capacity
                  </span>

                  <strong>
                    {analytics.going} /{" "}
                    {analytics.capacity}
                  </strong>
                </div>

                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${analytics.utilization}%`,
                    }}
                  />
                </div>

                <p>
                  {Math.max(
                    analytics.capacity -
                      analytics.going,
                    0
                  )}{" "}
                  seats available
                </p>
              </div>
            </div>

            {/* ORGANIZER QR */}
            {isOwner && (
              <>
                <div className="feature-panel">
                  <div>
                    <h2>
                      🔳 Event QR
                    </h2>

                    <p>
                      Share this QR with
                      attendees.
                    </p>
                  </div>

                  <button
                    className="primary-btn"
                    onClick={() =>
                      generateEventQR(
                        event
                      )
                    }
                  >
                    Generate Event QR
                  </button>
                </div>

                <div className="feature-panel">
                  <div>
                    <h2>
                      📷 Check-in Scanner
                    </h2>

                    <p>
                      Scan attendee
                      check-in QR codes.
                    </p>
                  </div>

                  <button
                    className="secondary-btn"
                    onClick={() => {
                      setScannerType(
                        "checkin"
                      );
                      setShowScanner(true);
                    }}
                  >
                    Open Scanner
                  </button>
                </div>

                <div className="feature-panel">
                  <div>
                    <h2>
                      📊 Attendance
                    </h2>

                    <p>
                      Checked in:{" "}
                      <strong>
                        {eventCheckins.length}
                      </strong>
                    </p>
                  </div>
                </div>

                {/* ANNOUNCEMENT */}
                <div className="announcement-panel">
                  <h2>
                    📢 Publish Announcement
                  </h2>

                  <input
                    placeholder="Announcement title"
                    value={
                      announcementTitle
                    }
                    onChange={(e) =>
                      setAnnouncementTitle(
                        e.target.value
                      )
                    }
                  />

                  <textarea
                    placeholder="Write announcement..."
                    rows="4"
                    value={
                      announcementMessage
                    }
                    onChange={(e) =>
                      setAnnouncementMessage(
                        e.target.value
                      )
                    }
                  />

                  <button
                    className="primary-btn"
                    onClick={() =>
                      createAnnouncement(
                        event
                      )
                    }
                  >
                    Publish Announcement
                  </button>
                </div>
              </>
            )}

            {/* ANNOUNCEMENTS */}
            <div className="announcements-section">
              <div className="section-title">
                <div>
                  <h2>
                    📢 Event Updates
                  </h2>

                  <p>
                    Latest announcements
                  </p>
                </div>
              </div>

              {eventAnnouncements.length ===
              0 ? (
                <div className="empty-small">
                  No announcements yet.
                </div>
              ) : (
                eventAnnouncements.map(
                  (announcement) => (
                    <div
                      className="announcement-card"
                      key={
                        announcement.id
                      }
                    >
                      <strong>
                        {
                          announcement.title
                        }
                      </strong>

                      <p>
                        {
                          announcement.message
                        }
                      </p>
                    </div>
                  )
                )
              )}
            </div>
          </section>
        </main>

        {/* QR MODAL */}
        {showQR && (
          <div className="modal-overlay">
            <div className="qr-modal">
              <button
                className="modal-close"
                onClick={() =>
                  setShowQR(false)
                }
              >
                ×
              </button>

              <h2>
                {scannerType ===
                "checkin"
                  ? "My Check-in QR"
                  : "Event QR Code"}
              </h2>

              <img
                src={qrImage}
                alt="QR Code"
                className="qr-image"
              />

              <p>
                Scan this QR using
                EventHub.
              </p>

              <button
                className="secondary-btn"
                onClick={() => {
                  const link =
                    document.createElement(
                      "a"
                    );

                  link.href = qrImage;
                  link.download =
                    "eventhub-qr.png";

                  link.click();
                }}
              >
                Download QR
              </button>
            </div>
          </div>
        )}

        {/* SCANNER MODAL */}
        {showScanner && (
          <div className="modal-overlay">
            <div className="scanner-modal">
              <button
                className="modal-close"
                onClick={() =>
                  setShowScanner(false)
                }
              >
                ×
              </button>

              <h2>
                📷 QR Scanner
              </h2>

              <p>
                Point the camera at the
                QR code.
              </p>

              <div id="qr-reader"></div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================
  // DASHBOARD
  // =========================================================

  const isOrganizer =
    profile?.role === "organizer";

  const myEvents = events.filter(
    (event) =>
      event.organizerId === user.uid
  );

  const organizerGoing = myEvents.reduce(
    (total, event) =>
      total + getGoing(event.id),
    0
  );

  const organizerMaybe = myEvents.reduce(
    (total, event) =>
      total + getMaybe(event.id),
    0
  );

  const organizerWaitlist =
    myEvents.reduce(
      (total, event) =>
        total +
        getWaitlisted(event.id).length,
      0
    );

  const unreadNotifications =
    notifications.filter(
      (n) => !n.read
    ).length;

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <div className="brand-icon">
            ☁
          </div>

          <div>
            <h1>EventHub</h1>

            <span>
              Real-Time Cloud Event Platform
            </span>
          </div>
        </div>

        <div className="topbar-right">
          <div className="user-info">
            <strong>
              {profile?.name ||
                user.email}
            </strong>

            <span>
              {profile?.role}
            </span>
          </div>

          <button
            className="logout-btn"
            onClick={logout}
          >
            Logout
          </button>
        </div>
      </header>

      <main className="main-container">
        {error && (
          <div className="alert error">
            {error}
          </div>
        )}

        {message && (
          <div className="alert success">
            {message}
          </div>
        )}

        {/* DASHBOARD HEADING */}
        <section className="dashboard-heading">
          <div>
            <span className="eyebrow">
              {isOrganizer
                ? "ORGANIZER DASHBOARD"
                : "ATTENDEE DASHBOARD"}
            </span>

            <h2>
              {isOrganizer
                ? "Manage Your Events"
                : "Discover Events"}
            </h2>

            <p>
              {isOrganizer
                ? "Create, monitor and manage events in real time."
                : "Find events and manage your RSVPs."}
            </p>
          </div>
        </section>

        {/* NAVIGATION */}
        <div className="dashboard-tabs">
          <button
            className={
              activeTab === "events"
                ? "tab active"
                : "tab"
            }
            onClick={() =>
              setActiveTab("events")
            }
          >
            📅 Events
          </button>

          <button
            className={
              activeTab === "my-rsvps"
                ? "tab active"
                : "tab"
            }
            onClick={() =>
              setActiveTab("my-rsvps")
            }
          >
            🎟 My RSVPs
          </button>

          <button
            className={
              activeTab === "notifications"
                ? "tab active"
                : "tab"
            }
            onClick={() =>
              setActiveTab(
                "notifications"
              )
            }
          >
            🔔 Notifications
            {unreadNotifications >
              0 && (
              <span className="notification-count">
                {unreadNotifications}
              </span>
            )}
          </button>
        </div>

        {/* ===================================================
            EVENTS TAB
        =================================================== */}

        {activeTab === "events" && (
          <>
            {/* STATS */}
            <section className="stats-grid">
              <div className="stat-card">
                <span className="stat-icon">
                  📅
                </span>

                <small>
                  {isOrganizer
                    ? "My Events"
                    : "Available Events"}
                </small>

                <strong>
                  {isOrganizer
                    ? myEvents.length
                    : filteredEvents.length}
                </strong>
              </div>

              <div className="stat-card">
                <span className="stat-icon">
                  ✓
                </span>

                <small>
                  {isOrganizer
                    ? "Going"
                    : "My Going"}
                </small>

                <strong>
                  {isOrganizer
                    ? organizerGoing
                    : myRSVPs.filter(
                        (r) =>
                          r.status ===
                          RSVP.GOING
                      ).length}
                </strong>
              </div>

              <div className="stat-card">
                <span className="stat-icon">
                  ?
                </span>

                <small>
                  {isOrganizer
                    ? "Maybe"
                    : "My Maybe"}
                </small>

                <strong>
                  {isOrganizer
                    ? organizerMaybe
                    : myRSVPs.filter(
                        (r) =>
                          r.status ===
                          RSVP.MAYBE
                      ).length}
                </strong>
              </div>

              <div className="stat-card">
                <span className="stat-icon">
                  ⏳
                </span>

                <small>
                  {isOrganizer
                    ? "Waitlist"
                    : "Notifications"}
                </small>

                <strong>
                  {isOrganizer
                    ? organizerWaitlist
                    : unreadNotifications}
                </strong>
              </div>
            </section>

            {/* ORGANIZER CREATE EVENT */}
            {isOrganizer && (
              <section className="content-grid">
                <div className="create-event-card">
                  <div className="section-title">
                    <div>
                      <h2>
                        Create Event
                      </h2>

                      <p>
                        Publish a new
                        event.
                      </p>
                    </div>
                  </div>

                  <form
                    onSubmit={
                      createEvent
                    }
                  >
                    <div className="form-group">
                      <label>
                        Event Title *
                      </label>

                      <input
                        value={
                          eventTitle
                        }
                        onChange={(e) =>
                          setEventTitle(
                            e.target
                              .value
                          )
                        }
                        placeholder="Cloud Computing Workshop"
                      />
                    </div>

                    <div className="form-group">
                      <label>
                        Description
                      </label>

                      <textarea
                        rows="4"
                        value={
                          eventDescription
                        }
                        onChange={(e) =>
                          setEventDescription(
                            e.target
                              .value
                          )
                        }
                        placeholder="Describe the event..."
                      />
                    </div>

                    <div className="two-column">
                      <div className="form-group">
                        <label>
                          Date *
                        </label>

                        <input
                          type="date"
                          value={
                            eventDate
                          }
                          onChange={(e) =>
                            setEventDate(
                              e.target
                                .value
                            )
                          }
                        />
                      </div>

                      <div className="form-group">
                        <label>
                          Time *
                        </label>

                        <input
                          type="time"
                          value={
                            eventTime
                          }
                          onChange={(e) =>
                            setEventTime(
                              e.target
                                .value
                            )
                          }
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>
                        Location *
                      </label>

                      <input
                        value={
                          eventLocation
                        }
                        onChange={(e) =>
                          setEventLocation(
                            e.target
                              .value
                          )
                        }
                        placeholder="Seminar Hall"
                      />
                    </div>

                    <div className="two-column">
                      <div className="form-group">
                        <label>
                          Capacity *
                        </label>

                        <input
                          type="number"
                          min="1"
                          value={
                            eventCapacity
                          }
                          onChange={(e) =>
                            setEventCapacity(
                              e.target
                                .value
                            )
                          }
                          placeholder="100"
                        />
                      </div>

                      <div className="form-group">
                        <label>
                          Category
                        </label>

                        <select
                          value={
                            eventCategory
                          }
                          onChange={(e) =>
                            setEventCategory(
                              e.target
                                .value
                            )
                          }
                        >
                          <option>
                            Workshop
                          </option>

                          <option>
                            Seminar
                          </option>

                          <option>
                            Conference
                          </option>

                          <option>
                            Webinar
                          </option>

                          <option>
                            College Event
                          </option>

                          <option>
                            Meetup
                          </option>
                        </select>
                      </div>
                    </div>

                    <button
                      className="primary-btn full-width"
                      disabled={
                        creatingEvent
                      }
                    >
                      {creatingEvent
                        ? "Creating..."
                        : "+ Create Event"}
                    </button>
                  </form>
                </div>

                <div className="events-section">
                  <div className="section-title">
                    <div>
                      <h2>
                        My Events
                      </h2>

                      <p>
                        Live event
                        analytics.
                      </p>
                    </div>

                    <span className="live-badge">
                      ● LIVE
                    </span>
                  </div>

                  {myEvents.length ===
                  0 ? (
                    <div className="empty-state">
                      <div>
                        📅
                      </div>

                      <h3>
                        No events yet
                      </h3>

                      <p>
                        Create your
                        first event.
                      </p>
                    </div>
                  ) : (
                    <div className="event-list">
                      {myEvents.map(
                        (event) => {
                          const analytics =
                            getEventAnalytics(
                              event.id
                            );

                          return (
                            <div
                              className="event-card"
                              key={
                                event.id
                              }
                            >
                              <div className="event-card-top">
                                <div>
                                  <span className="event-status">
                                    {
                                      event.status
                                    }
                                  </span>

                                  <h3>
                                    {
                                      event.title
                                    }
                                  </h3>

                                  <p>
                                    {
                                      event.description
                                    }
                                  </p>
                                </div>

                                <button
                                  className="delete-btn"
                                  onClick={() =>
                                    deleteEvent(
                                      event
                                    )
                                  }
                                >
                                  Delete
                                </button>
                              </div>

                              <div className="event-meta">
                                <span>
                                  📅{" "}
                                  {
                                    event.date
                                  }
                                </span>

                                <span>
                                  ⏰{" "}
                                  {
                                    event.time
                                  }
                                </span>

                                <span>
                                  📍{" "}
                                  {
                                    event.location
                                  }
                                </span>
                              </div>

                              <div className="mini-rsvp">
                                <div>
                                  <strong>
                                    {
                                      analytics.going
                                    }
                                  </strong>
                                  <small>
                                    Going
                                  </small>
                                </div>

                                <div>
                                  <strong>
                                    {
                                      analytics.maybe
                                    }
                                  </strong>
                                  <small>
                                    Maybe
                                  </small>
                                </div>

                                <div>
                                  <strong>
                                    {
                                      analytics.notGoing
                                    }
                                  </strong>
                                  <small>
                                    Not Going
                                  </small>
                                </div>

                                <div>
                                  <strong>
                                    {
                                      analytics.waitlist
                                    }
                                  </strong>
                                  <small>
                                    Waitlist
                                  </small>
                                </div>
                              </div>

                              <div className="card-actions">
                                <button
                                  className="primary-btn"
                                  onClick={() =>
                                    setSelectedEvent(
                                      event
                                    )
                                  }
                                >
                                  Manage →
                                </button>

                                <button
                                  className="secondary-btn"
                                  onClick={() =>
                                    generateEventQR(
                                      event
                                    )
                                  }
                                >
                                  🔳 QR
                                </button>
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* ATTENDEE EVENT LIST */}
            {!isOrganizer && (
              <section className="events-section full-section">
                <div className="section-title">
                  <div>
                    <h2>
                      Upcoming Events
                    </h2>

                    <p>
                      Browse and RSVP.
                    </p>
                  </div>

                  <span className="live-badge">
                    ● LIVE
                  </span>
                </div>

                <div className="search-row">
                  <input
                    placeholder="🔍 Search events..."
                    value={search}
                    onChange={(e) =>
                      setSearch(
                        e.target.value
                      )
                    }
                  />

                  <select
                    value={
                      categoryFilter
                    }
                    onChange={(e) =>
                      setCategoryFilter(
                        e.target
                          .value
                      )
                    }
                  >
                    <option value="ALL">
                      All Categories
                    </option>

                    <option>
                      Workshop
                    </option>

                    <option>
                      Seminar
                    </option>

                    <option>
                      Conference
                    </option>

                    <option>
                      Webinar
                    </option>

                    <option>
                      College Event
                    </option>

                    <option>
                      Meetup
                    </option>
                  </select>
                </div>

                {filteredEvents.length ===
                0 ? (
                  <div className="empty-state">
                    <div>
                      🔍
                    </div>

                    <h3>
                      No events found
                    </h3>

                    <p>
                      Try another
                      search.
                    </p>
                  </div>
                ) : (
                  <div className="event-grid">
                    {filteredEvents.map(
                      (event) => {
                        const going =
                          getGoing(
                            event.id
                          );

                        const capacity =
                          Number(
                            event.capacity ||
                              0
                          );

                        const my =
                          getUserRSVP(
                            event.id
                          );

                        return (
                          <div
                            className="attendee-event-card"
                            key={
                              event.id
                            }
                          >
                            <div className="card-status-row">
                              <span className="event-status">
                                {
                                  event.category
                                }
                              </span>

                              {my && (
                                <span className="my-rsvp-badge">
                                  {
                                    my.status
                                  }
                                </span>
                              )}
                            </div>

                            <h3>
                              {
                                event.title
                              }
                            </h3>

                            <p className="card-description">
                              {
                                event.description
                              }
                            </p>

                            <div className="event-details">
                              <span>
                                📅{" "}
                                {
                                  event.date
                                }
                              </span>

                              <span>
                                ⏰{" "}
                                {
                                  event.time
                                }
                              </span>

                              <span>
                                📍{" "}
                                {
                                  event.location
                                }
                              </span>

                              <span>
                                👥{" "}
                                {Math.max(
                                  capacity -
                                    going,
                                  0
                                )}{" "}
                                seats available
                              </span>
                            </div>

                            <button
                              className="primary-btn full-width"
                              onClick={() =>
                                setSelectedEvent(
                                  event
                                )
                              }
                            >
                              View & RSVP →
                            </button>
                          </div>
                        );
                      }
                    )}
                  </div>
                )}
              </section>
            )}
          </>
        )}

        {/* ===================================================
            MY RSVPS
        =================================================== */}

        {activeTab ===
          "my-rsvps" && (
          <section className="events-section full-section">
            <div className="section-title">
              <div>
                <h2>
                  🎟 My RSVPs
                </h2>

                <p>
                  Your event
                  registrations.
                </p>
              </div>
            </div>

            {myRSVPs.length ===
            0 ? (
              <div className="empty-state">
                <div>
                  🎟
                </div>

                <h3>
                  No RSVPs yet
                </h3>

                <p>
                  Browse events
                  and RSVP.
                </p>
              </div>
            ) : (
              <div className="event-grid">
                {myRSVPs.map(
                  (rsvp) => {
                    const event =
                      events.find(
                        (e) =>
                          e.id ===
                          rsvp.eventId
                      );

                    if (!event)
                      return null;

                    return (
                      <div
                        className="attendee-event-card"
                        key={
                          rsvp.id
                        }
                      >
                        <span className="event-status">
                          {
                            rsvp.status
                          }
                        </span>

                        <h3>
                          {
                            event.title
                          }
                        </h3>

                        <div className="event-details">
                          <span>
                            📅{" "}
                            {
                              event.date
                            }
                          </span>

                          <span>
                            ⏰{" "}
                            {
                              event.time
                            }
                          </span>

                          <span>
                            📍{" "}
                            {
                              event.location
                            }
                          </span>
                        </div>

                        <button
                          className="secondary-btn full-width"
                          onClick={() =>
                            setSelectedEvent(
                              event
                            )
                          }
                        >
                          Open Event
                        </button>
                      </div>
                    );
                  }
                )}
              </div>
            )}
          </section>
        )}

        {/* ===================================================
            NOTIFICATIONS
        =================================================== */}

        {activeTab ===
          "notifications" && (
          <section className="events-section full-section">
            <div className="section-title">
              <div>
                <h2>
                  🔔 Notifications
                </h2>

                <p>
                  RSVP and event
                  updates.
                </p>
              </div>
            </div>

            {notifications.length ===
            0 ? (
              <div className="empty-state">
                <div>
                  🔔
                </div>

                <h3>
                  No notifications
                </h3>
              </div>
            ) : (
              <div className="notification-list">
                {notifications.map(
                  (notification) => (
                    <div
                      className={
                        notification.read
                          ? "notification-card read"
                          : "notification-card unread"
                      }
                      key={
                        notification.id
                      }
                      onClick={() =>
                        markNotificationRead(
                          notification
                        )
                      }
                    >
                      <div>
                        <strong>
                          {
                            notification.type
                          }
                        </strong>

                        <p>
                          {
                            notification.message
                          }
                        </p>
                      </div>

                      {!notification.read && (
                        <span className="new-dot">
                          NEW
                        </span>
                      )}
                    </div>
                  )
                )}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

export default App;