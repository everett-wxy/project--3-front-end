import React, { useState, useEffect, useContext } from "react";
import UserContext from "../context/user";
import styles from "./Accomboard.module.css";
import ActivityCard from "./ActivityCard";
import { useParams } from "react-router-dom";
import { TripContext } from "../context/TripContext";
import { toast } from "react-toastify";

const ActivityContainer = (props) => {
  const { triggerUpdate, destinationInput } = useContext(TripContext);
  const { accessToken } = useContext(UserContext);
  const [activitiesData, setActivitiesData] = useState([]);
  const [tripActivitiesData, setTripActivitiesData] = useState([]);
  const [tripDestination, setTripDestination] = useState("");
  const { id } = useParams();

  //if tripActivitiesData.include activityId => btn = orange

  const getTripData = async () => {
    try {
      const res = await fetch(
        import.meta.env.VITE_SERVER + "/WanderGoWhere/onetrip/" + id,
        {
          method: "GET",
          headers: {
            "Content-type": "application/json",
            authorization: "Bearer " + accessToken,
          },
        }
      );
      if (!res.ok) {
        throw new Error("data error");
      } else {
        const data = await res.json();
        setTripDestination(data.itineraries[0]?.arrPort);
      }
    } catch (error) {
      console.error(error.message);
    }
  };

  const getActivitiesData = async (destinationInput) => {
    let city = destinationInput;

    if (city === "IST") {
      city = "Istanbul, Turkey";
    }
    if (city === "CHC") {
      city = "Christchurch, New Zealand";
    }
    if (city === "CTS") {
      city = "Sapporo, Hokkaido, Japan";
    }
    if (city === "TOS") {
      city = "Tromso, Norway";
    }
    if (city === "CAI") {
      city = "Cairo, Egypt";
    }

    try {
      const res = await fetch(
        import.meta.env.VITE_SERVER + "/WanderGoWhere/activities",
        {
          method: "POST",
          headers: {
            "Content-type": "application/json",
          },
          body: JSON.stringify({
            city: city, //sample - fix for inputs.
          }),
        }
      );
      if (!res.ok) {
        throw new Error("data error");
      } else {
        const data = await res.json();
        setActivitiesData(data);
      }
    } catch (error) {
      console.error(error.message);
    }
  };

  const addActivityToTrip = async (activityId) => {
    const tripActivityIds = tripActivitiesData.map((activity) => activity._id); // get current trip activity IDs
    if (tripActivityIds.includes(activityId)) {
      alert("Activity already selected");
      return;
    }

    try {
      const res = await fetch(
        import.meta.env.VITE_SERVER +
          "/WanderGoWhere/trips/" +
          id +
          "/activities",
        {
          method: "POST",
          headers: {
            "Content-type": "application/json",
            authorization: "Bearer " + accessToken,
          },
          body: JSON.stringify({
            activitiesId: activityId,
          }),
        }
      );
      if (!res.ok) {
        const errorData = await res.json();
        console.error("Error response:", errorData);
        throw new Error(errorData.message || "Failed to add activity");
      } else {
        const data = await res.json();
        await getTripActivitiesData();
        triggerUpdate();
        toast.success("💃🏼 Activities added.");
        if (props.onComplete) {
          props.onComplete();
        }
      }
    } catch (error) {
      console.error("Error in addActivitiesToTrip:", error.message);
    }
  };

  const delActivityFromTrip = async (activityId) => {
    try {
      const res = await fetch(
        import.meta.env.VITE_SERVER +
          "/WanderGoWhere/trips/" +
          id +
          "/activities",
        {
          method: "DELETE",
          headers: {
            "Content-type": "application/json",
            authorization: "Bearer " + accessToken,
          },
          body: JSON.stringify({
            activitiesId: activityId,
          }),
        }
      );
      if (!res.ok) {
        throw new Error("data error");
      } else {
        const data = await res.json();
        await getTripActivitiesData();
        triggerUpdate();
        toast.success("🗑️ Activities removed.");
      }
    } catch (error) {
      console.error(error.message);
      return;
    }
  };

  const getTripActivitiesData = async () => {
    try {
      const res = await fetch(
        import.meta.env.VITE_SERVER + "/WanderGoWhere/trips/" + id,
        {
          method: "GET",
          headers: {
            "Content-type": "application/json",
            authorization: "Bearer " + accessToken,
          },
        }
      );
      if (!res.ok) {
        throw new Error("data error");
      } else {
        const data = await res.json();
        setTripActivitiesData(data.activities || []);
      }
    } catch (error) {
      console.error(error.message);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (destinationInput) {
        await getActivitiesData(destinationInput);
        await getTripActivitiesData();
      }
    };
    fetchData();
  }, [destinationInput]);

  useEffect(() => {
    const fetchData = async () => {
      await getTripData();
      if (tripDestination) {
        await getActivitiesData(tripDestination);
        await getTripActivitiesData(); //grab the options from this city.
        // same destination.
        //how to retrive - selected ones.?
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (tripDestination) {
        await getActivitiesData(tripDestination);
        await getTripActivitiesData();
      }
    };
    fetchData();
  }, [tripDestination]);

  return (
    <div className={styles.flightcontainer}>
      <div
        className={styles.flightctnrcomponent}
        style={{
          borderRadius: "40px 40px 0 0",
          padding: "15px 0 0 50px",
        }}
      >
        <h6>{props.message}</h6>
      </div>

      <div className={styles.flightcardbox}>
        {activitiesData.map((activity) => {
          const isSelected = tripActivitiesData.includes(activity._id);

          return (
            <ActivityCard
              key={activity._id}
              hotelImg={
                activity.imageOne ||
                "https://cdn.midjourney.com/c7ecbb3e-4749-4ba7-9511-8803abf27568/0_2.png"
              }
              price={activity.activityPrice}
              hotelName={activity.activityName}
              details={activity.activityDescription}
              onClick={() => {
                if (isSelected) {
                  delActivityFromTrip(activity._id);
                } else {
                  addActivityToTrip(activity._id);
                }
              }}
              btnMsg={isSelected ? "Selected" : "+"}
              btnStyle={{
                backgroundColor: isSelected ? "orangered" : "var(--main)",
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

//if tripActivitiesData.include activityId => btn = orange

export default ActivityContainer;
