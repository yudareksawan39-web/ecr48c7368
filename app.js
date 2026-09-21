// ======================================================
// PANRITA FALAK
// GPS + KOMPAS + KIBLAT + WAKTU SALAT
// ======================================================


// ======================================================
// KOORDINAT KA'BAH
// ======================================================

const KAABAH_LAT = 21.422487;
const KAABAH_LON = 39.826206;


// ======================================================
// VARIABEL
// ======================================================

let currentLatitude = null;
let currentLongitude = null;

let qiblaAzimuth = null;

let currentHeading = null;

let filteredHeading = null;

let gpsStarted = false;

let compassStarted = false;

let prayerTimesToday = null;


// ======================================================
// MATEMATIKA
// ======================================================

function toRadians(deg) {

    return deg * Math.PI / 180;
}


function toDegrees(rad) {

    return rad * 180 / Math.PI;
}


function normalizeAngle(angle) {

    return (
        (angle % 360) + 360
    ) % 360;
}


// ======================================================
// ARAH KIBLAT
// ======================================================

function calculateQibla(
    lat,
    lon
) {

    const lat1 =
        toRadians(lat);

    const lat2 =
        toRadians(
            KAABAH_LAT
        );


    const deltaLon =
        toRadians(
            KAABAH_LON - lon
        );


    const y =
        Math.sin(deltaLon) *
        Math.cos(lat2);


    const x =
        Math.cos(lat1) *
        Math.sin(lat2)

        -

        Math.sin(lat1) *
        Math.cos(lat2) *
        Math.cos(deltaLon);


    const bearing =
        toDegrees(
            Math.atan2(
                y,
                x
            )
        );


    return normalizeAngle(
        bearing
    );
}


// ======================================================
// JARAK KA'BAH
// ======================================================

function calculateDistance(
    lat1,
    lon1,
    lat2,
    lon2
) {

    const R = 6371;


    const dLat =
        toRadians(
            lat2 - lat1
        );


    const dLon =
        toRadians(
            lon2 - lon1
        );


    const a =
        Math.sin(
            dLat / 2
        ) ** 2

        +

        Math.cos(
            toRadians(lat1)
        ) *

        Math.cos(
            toRadians(lat2)
        ) *

        Math.sin(
            dLon / 2
        ) ** 2;


    const c =
        2 *

        Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
        );


    return R * c;
}


// ======================================================
// GPS BERHASIL
// ======================================================

function updateGPS(position) {

    const lat =
        position.coords.latitude;

    const lon =
        position.coords.longitude;

    const accuracy =
        position.coords.accuracy;


    currentLatitude = lat;

    currentLongitude = lon;


    // Latitude
    const latitudeElement =
        document.getElementById(
            "latitude"
        );


    if (latitudeElement) {

        latitudeElement.textContent =
            lat.toFixed(6) +
            "°";
    }


    // Longitude
    const longitudeElement =
        document.getElementById(
            "longitude"
        );


    if (longitudeElement) {

        longitudeElement.textContent =
            lon.toFixed(6) +
            "°";
    }


    // Akurasi
    const accuracyElement =
        document.getElementById(
            "accuracy"
        );


    if (accuracyElement) {

        accuracyElement.textContent =
            "± " +
            accuracy.toFixed(1) +
            " m";
    }


    // ==================================================
    // KIBLAT
    // ==================================================

    qiblaAzimuth =
        calculateQibla(
            lat,
            lon
        );


    const qiblaElement =
        document.getElementById(
            "qibla"
        );


    if (qiblaElement) {

        qiblaElement.textContent =
            qiblaAzimuth.toFixed(1) +
            "°";
    }


    // ==================================================
    // JARAK
    // ==================================================

    const distance =
        calculateDistance(
            lat,
            lon,
            KAABAH_LAT,
            KAABAH_LON
        );


    const distanceElement =
        document.getElementById(
            "distance"
        );


    if (distanceElement) {

        distanceElement.textContent =
            distance.toFixed(1) +
            " km";
    }


    // ==================================================
    // WAKTU SALAT
    // ==================================================

    calculatePrayerTimes(
        lat,
        lon
    );


    // ==================================================
    // KOMPAS
    // ==================================================

    if (
        currentHeading !== null
    ) {

        updateNeedle();
    }


    const status =
        document.getElementById(
            "status"
        );


    if (status) {

        status.textContent =
            "✓ GPS aktif";
    }
}


// ======================================================
// GPS ERROR
// ======================================================

function gpsError(error) {

    const status =
        document.getElementById(
            "status"
        );


    if (status) {

        status.textContent =
            "GPS error: " +
            error.message;
    }


    console.error(
        "GPS ERROR:",
        error
    );
}


// ======================================================
// MULAI GPS
// ======================================================

function startGPS() {

    if (
        !navigator.geolocation
    ) {

        document.getElementById(
            "status"
        ).textContent =
            "Browser tidak mendukung GPS.";

        return;
    }


    if (gpsStarted) {

        return;
    }


    gpsStarted = true;


    navigator.geolocation.watchPosition(
        updateGPS,
        gpsError,
        {
            enableHighAccuracy: true,

            maximumAge: 0,

            timeout: 15000
        }
    );
}


// ======================================================
// FILTER KOMPAS
// ======================================================

function smoothHeading(
    newHeading
) {

    newHeading =
        normalizeAngle(
            newHeading
        );


    if (
        filteredHeading === null
    ) {

        filteredHeading =
            newHeading;

        return filteredHeading;
    }


    let difference =
        normalizeAngle(
            newHeading -
            filteredHeading
        );


    if (
        difference > 180
    ) {

        difference -= 360;
    }


    const smoothing =
        0.18;


    filteredHeading =
        normalizeAngle(
            filteredHeading +
            difference *
            smoothing
        );


    return filteredHeading;
}


// ======================================================
// SENSOR KOMPAS
// ======================================================

function handleOrientation(
    event
) {

    let heading = null;


    // ----------------------------------------------
    // iPhone / Safari
    // ----------------------------------------------

    if (
        typeof event.webkitCompassHeading ===
            "number" &&

        !isNaN(
            event.webkitCompassHeading
        )
    ) {

        heading =
            event.webkitCompassHeading;
    }


    // ----------------------------------------------
    // SENSOR ABSOLUT
    // ----------------------------------------------

    else if (
        event.absolute === true &&

        typeof event.alpha ===
            "number"
    ) {

        heading =
            360 -
            event.alpha;
    }


    // ----------------------------------------------
    // FALLBACK
    // ----------------------------------------------

    else if (
        typeof event.alpha ===
            "number"
    ) {

        heading =
            360 -
            event.alpha;
    }


    if (
        heading === null ||
        isNaN(heading)
    ) {

        return;
    }


    heading =
        normalizeAngle(
            heading
        );


    currentHeading =
        smoothHeading(
            heading
        );


    const headingElement =
        document.getElementById(
            "heading"
        );


    if (headingElement) {

        headingElement.textContent =
            currentHeading.toFixed(1) +
            "°";
    }


    updateNeedle();
}


// ======================================================
// JARUM KIBLAT
// ======================================================

function updateNeedle() {

    if (
        qiblaAzimuth === null ||

        currentHeading === null
    ) {

        return;
    }


    let difference =
        normalizeAngle(
            qiblaAzimuth -
            currentHeading
        );


    let displayDifference =
        difference;


    if (
        displayDifference > 180
    ) {

        displayDifference -= 360;
    }


    const differenceElement =
        document.getElementById(
            "difference"
        );


    if (differenceElement) {

        differenceElement.textContent =
            displayDifference.toFixed(1) +
            "°";
    }


    const needle =
        document.getElementById(
            "needle"
        );


    if (needle) {

        needle.style.transform =
            `rotate(${difference}deg)`;
    }


    const status =
        document.getElementById(
            "status"
        );


    if (status) {

        if (
            Math.abs(
                displayDifference
            ) <= 3
        ) {

            status.textContent =
                "✓ ARAH KIBLAT TERCAPAI";

        } else {

            status.textContent =
                "Kompas aktif — arahkan jarum ke kiblat.";
        }
    }
}


// ======================================================
// IZIN SENSOR + MULAI KOMPAS
// ======================================================

async function startCompass() {

    if (compassStarted) {

        return;
    }


    try {

        // ------------------------------------------
        // iOS / browser yang membutuhkan izin
        // ------------------------------------------

        if (
            typeof DeviceOrientationEvent !==
                "undefined" &&

            typeof DeviceOrientationEvent
                .requestPermission ===
                "function"
        ) {

            const permission =
                await DeviceOrientationEvent
                    .requestPermission(
                        true
                    );


            if (
                permission !==
                "granted"
            ) {

                document.getElementById(
                    "status"
                ).textContent =
                    "Izin sensor kompas ditolak.";

                return;
            }
        }


        // ------------------------------------------
        // Sensor absolut
        // ------------------------------------------

        window.addEventListener(
            "deviceorientationabsolute",
            handleOrientation,
            true
        );


        // ------------------------------------------
        // Sensor biasa
        // ------------------------------------------

        window.addEventListener(
            "deviceorientation",
            handleOrientation,
            true
        );


        compassStarted = true;


        document.getElementById(
            "status"
        ).textContent =
            "✓ Sensor kompas aktif.";

    } catch (error) {

        console.error(
            "COMPASS ERROR:",
            error
        );


        document.getElementById(
            "status"
        ).textContent =
            "Sensor kompas tidak dapat digunakan.";
    }
}


// ======================================================
// TOMBOL MULAI
// ======================================================

const startButton =
    document.getElementById(
        "startButton"
    );


if (startButton) {

    startButton.addEventListener(
        "click",
        async function () {

            document.getElementById(
                "status"
            ).textContent =
                "Memulai GPS dan kompas...";


            startGPS();


            await startCompass();
        }
    );
}


// ======================================================
// GOOGLE EARTH
// ======================================================

const earthButton =
    document.getElementById(
        "earthButton"
    );


if (earthButton) {

    earthButton.addEventListener(
        "click",
        function () {

            if (
                currentLatitude === null ||
                currentLongitude === null
            ) {

                alert(
                    "Lokasi GPS belum tersedia. Jalankan GPS terlebih dahulu."
                );

                return;
            }


            const earthURL =
                "https://earth.google.com/web/search/" +

                currentLatitude +

                "," +

                currentLongitude;


            window.open(
                earthURL,
                "_blank"
            );
        }
    );
}


// ======================================================
// JAM REAL-TIME
// ======================================================

function updateRealTimeClock() {

    const now =
        new Date();


    const hours =
        String(
            now.getHours()
        ).padStart(
            2,
            "0"
        );


    const minutes =
        String(
            now.getMinutes()
        ).padStart(
            2,
            "0"
        );


    const seconds =
        String(
            now.getSeconds()
        ).padStart(
            2,
            "0"
        );


    const clock =
        document.getElementById(
            "realTimeClock"
        );


    if (clock) {

        clock.textContent =
            `${hours}:${minutes}:${seconds}`;
    }


    updateNextPrayer();
}


updateRealTimeClock();


setInterval(
    updateRealTimeClock,
    1000
);


// ======================================================
// PARAMETER WAKTU SALAT
// ======================================================

const PRAYER_ANGLES = {

    // Subuh
    fajr: 20,

    // Matahari terbit/terbenam
    sunrise: 0.833,

    sunset: 0.833,

    // Isya
    isha: 18
};


// ======================================================
// DAY OF YEAR
// ======================================================

function getDayOfYear(
    date
) {

    const start =
        new Date(
            date.getFullYear(),
            0,
            0
        );


    const diff =
        date - start;


    return Math.floor(
        diff /
        86400000
    );
}


// ======================================================
// POSISI MATAHARI
// ======================================================

function solarPosition(
    date
) {

    const day =
        getDayOfYear(
            date
        );


    const gamma =
        2 *
        Math.PI /
        365 *
        (day - 1);


    const equationOfTime =
        229.18 *
        (
            0.000075 +

            0.001868 *
            Math.cos(gamma) -

            0.032077 *
            Math.sin(gamma) -

            0.014615 *
            Math.cos(2 * gamma) -

            0.040849 *
            Math.sin(2 * gamma)
        );


    const declination =
        0.006918 -

        0.399912 *
        Math.cos(gamma) +

        0.070257 *
        Math.sin(gamma) -

        0.006758 *
        Math.cos(2 * gamma) +

        0.000907 *
        Math.sin(2 * gamma) -

        0.002697 *
        Math.cos(3 * gamma) +

        0.00148 *
        Math.sin(3 * gamma);


    return {

        equationOfTime,

        declination:
            toDegrees(
                declination
            )
    };
}


// ======================================================
// HOUR ANGLE MATAHARI
// ======================================================

function solarHourAngle(
    latitude,
    declination,
    altitude
) {

    const lat =
        toRadians(
            latitude
        );


    const dec =
        toRadians(
            declination
        );


    const alt =
        toRadians(
            altitude
        );


    const cosH =
        (
            Math.sin(alt) -

            Math.sin(lat) *
            Math.sin(dec)
        )

        /

        (
            Math.cos(lat) *
            Math.cos(dec)
        );


    if (
        cosH < -1 ||
        cosH > 1
    ) {

        return null;
    }


    return toDegrees(
        Math.acos(
            cosH
        )
    );
}


// ======================================================
// WAKTU SALAT
// ======================================================

function calculatePrayerTimes(
    latitude,
    longitude
) {

    const now =
        new Date();


    const solar =
        solarPosition(
            now
        );


    const equationOfTime =
        solar.equationOfTime;


    const declination =
        solar.declination;


    // Zona waktu HP
    const timezone =
        -now.getTimezoneOffset()
        / 60;


    // Solar noon
    const solarNoon =
        720 -

        4 * longitude -

        equationOfTime +

        timezone * 60;


    // ----------------------------------------------
    // SUBUH
    // ----------------------------------------------

    const fajrAngle =
        solarHourAngle(
            latitude,
            declination,
            -PRAYER_ANGLES.fajr
        );


    // ----------------------------------------------
    // TERBIT
    // ----------------------------------------------

    const sunriseAngle =
        solarHourAngle(
            latitude,
            declination,
            -PRAYER_ANGLES.sunrise
        );


    // ----------------------------------------------
    // MAGRIB
    // ----------------------------------------------

    const sunsetAngle =
        solarHourAngle(
            latitude,
            declination,
            -PRAYER_ANGLES.sunset
        );


    // ----------------------------------------------
    // ISYA
    // ----------------------------------------------

    const ishaAngle =
        solarHourAngle(
            latitude,
            declination,
            -PRAYER_ANGLES.isha
        );


    // ----------------------------------------------
    // ASAR
    // ----------------------------------------------

    const latitudeDifference =
        Math.abs(
            toRadians(
                latitude -
                declination
            )
        );


    const asrAltitude =
        toDegrees(
            Math.atan(
                1 /
                (
                    1 +

                    Math.tan(
                        latitudeDifference
                    )
                )
            )
        );


    const asrAngle =
        solarHourAngle(
            latitude,
            declination,
            asrAltitude
        );


    // ----------------------------------------------
    // HASIL
    // ----------------------------------------------

    const prayers = {

        subuh:
            fajrAngle === null
                ? null
                :
                solarNoon -
                fajrAngle / 15,


        terbit:
            sunriseAngle === null
                ? null
                :
                solarNoon -
                sunriseAngle / 15,


        zuhur:
            solarNoon + 1 / 60,


        asar:
            asrAngle === null
                ? null
                :
                solarNoon +
                asrAngle / 15,


        magrib:
            sunsetAngle === null
                ? null
                :
                solarNoon +
                sunsetAngle / 15,


        isya:
            ishaAngle === null
                ? null
                :
                solarNoon +
                ishaAngle / 15

    };


    prayerTimesToday =
        prayers;


    displayPrayerTimes(
        prayers
    );
}


// ======================================================
// FORMAT JAM SALAT
// ======================================================

function formatPrayerTime(
    decimalHours
) {

    if (
        decimalHours === null ||
        !isFinite(decimalHours)
    ) {

        return "--:--";
    }


    decimalHours =
        (
            decimalHours % 24 +
            24
        ) % 24;


    let hours =
        Math.floor(
            decimalHours
        );


    let minutes =
        Math.round(
            (
                decimalHours -
                hours
            ) * 60
        );


    if (
        minutes >= 60
    ) {

        minutes = 0;

        hours++;

        hours %= 24;
    }


    return (

        String(hours)
            .padStart(
                2,
                "0"
            )

        +

        ":"

        +

        String(minutes)
            .padStart(
                2,
                "0"
            )
    );
}


// ======================================================
// TAMPILKAN WAKTU SALAT
// ======================================================

function displayPrayerTimes(
    prayers
) {

    const elements = {

        subuh:
            document.getElementById(
                "subuh"
            ),

        terbit:
            document.getElementById(
                "terbit"
            ),

        zuhur:
            document.getElementById(
                "zuhur"
            ),

        asar:
            document.getElementById(
                "asar"
            ),

        magrib:
            document.getElementById(
                "magrib"
            ),

        isya:
            document.getElementById(
                "isya"
            )
    };


    if (elements.subuh) {

        elements.subuh.textContent =
            formatPrayerTime(
                prayers.subuh
            );
    }


    if (elements.terbit) {

        elements.terbit.textContent =
            formatPrayerTime(
                prayers.terbit
            );
    }


    if (elements.zuhur) {

        elements.zuhur.textContent =
            formatPrayerTime(
                prayers.zuhur
            );
    }


    if (elements.asar) {

        elements.asar.textContent =
            formatPrayerTime(
                prayers.asar
            );
    }


    if (elements.magrib) {

        elements.magrib.textContent =
            formatPrayerTime(
                prayers.magrib
            );
    }


    if (elements.isya) {

        elements.isya.textContent =
            formatPrayerTime(
                prayers.isya
            );
    }


    updateNextPrayer();
}


// ======================================================
// SALAT BERIKUTNYA
// ======================================================

function updateNextPrayer() {

    if (
        prayerTimesToday === null
    ) {

        return;
    }


    const now =
        new Date();


    const currentMinutes =
        now.getHours() * 60 +

        now.getMinutes() +

        now.getSeconds() / 60;


    const names = {

        subuh: "Subuh",

        zuhur: "Zuhur",

        asar: "Asar",

        magrib: "Magrib",

        isya: "Isya"
    };


    const order = [

        "subuh",

        "zuhur",

        "asar",

        "magrib",

        "isya"
    ];


    let next = null;

    let nextMinutes = null;


    for (
        const key of order
    ) {

        const value =
            prayerTimesToday[key];


        if (
            value === null ||
            !isFinite(value)
        ) {

            continue;
        }


        const prayerMinutes =
            value * 60;


        if (
            prayerMinutes >
            currentMinutes
        ) {

            next = key;

            nextMinutes =
                prayerMinutes;

            break;
        }
    }


    // Setelah Isya,
    // berikutnya Subuh besok
    if (
        next === null
    ) {

        next = "subuh";

        nextMinutes =
            prayerTimesToday.subuh *
            60 +
            1440;
    }


    let remaining =
        nextMinutes -
        currentMinutes;


    if (
        remaining < 0
    ) {

        remaining = 0;
    }


    const hours =
        Math.floor(
            remaining / 60
        );


    const minutes =
        Math.floor(
            remaining % 60
        );


    const seconds =
        Math.floor(
            (
                remaining -
                Math.floor(remaining)
            ) * 60
        );


    const nextElement =
        document.getElementById(
            "nextPrayer"
        );


    if (nextElement) {

        nextElement.textContent =

            "⏳ Berikutnya: " +

            names[next] +

            " — " +

            formatPrayerTime(
                prayerTimesToday[next]
            ) +

            " | " +

            String(hours)
                .padStart(2, "0") +

            ":" +

            String(minutes)
                .padStart(2, "0") +

            ":" +

            String(seconds)
                .padStart(2, "0");
    }
}


// ======================================================
// REFRESH WAKTU SALAT SETIAP HARI
// ======================================================

let lastDate =
    new Date().toDateString();


setInterval(
    function () {

        const today =
            new Date().toDateString();


        if (
            today !== lastDate
        ) {

            lastDate =
                today;


            if (
                currentLatitude !== null &&
                currentLongitude !== null
            ) {

                calculatePrayerTimes(
                    currentLatitude,
                    currentLongitude
                );
            }
        }

    },
    60000
);