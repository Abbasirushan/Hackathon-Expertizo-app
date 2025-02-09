import React, { useContext, useRef, useReducer, useEffect, useState } from "react";
import { Avatar } from "@material-tailwind/react";
import avatar from "../../assets/images/avatar.jpg";
import { AuthContext } from "../AppContext/AppContext";
import {
  setDoc,
  collection,
  doc,
  serverTimestamp,
  orderBy,
  query,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../firebase/firebase";
import {
  PostsReducer,
  postActions,
  postsStates,
} from "../AppContext/PostReducer";
import Comment from "./Comment";

const CommentSection = ({ postId }) => {
  const commentRef = useRef(""); // Input reference
  const { user, userData } = useContext(AuthContext);
  const [state, dispatch] = useReducer(PostsReducer, postsStates);
  const { ADD_COMMENT, HANDLE_ERROR } = postActions;
  const [isSubmitting, setIsSubmitting] = useState(false); // Prevent multiple clicks

  // ✅ Add Comment Function (Fixed)
  const addComment = async (e) => {
    e.preventDefault(); // Prevent page reload
    if (!commentRef.current.value.trim()) return; // Don't allow empty comments

    setIsSubmitting(true); // Prevent multiple clicks

    try {
      const commentDoc = doc(collection(db, "posts", postId, "comments"));
      await setDoc(commentDoc, {
        id: commentDoc.id,
        comment: commentRef.current.value.trim(),
        image: user?.photoURL || "",
        name: userData?.name || user?.displayName || "Anonymous",
        timestamp: serverTimestamp(),
      });
      commentRef.current.value = ""; // ✅ Clear input after comment
    } catch (err) {
      console.error("Error adding comment:", err);
      dispatch({ type: HANDLE_ERROR });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ✅ Fetch Comments on Load
  useEffect(() => {
    const collectionOfComments = collection(db, `posts/${postId}/comments`);
    const q = query(collectionOfComments, orderBy("timestamp", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        dispatch({
          type: ADD_COMMENT,
          comments: snapshot.docs.map((doc) => doc.data()),
        });
      },
      (err) => {
        console.error("Error fetching comments:", err);
        dispatch({ type: HANDLE_ERROR });
      }
    );

    return () => unsubscribe();
  }, [postId, ADD_COMMENT, HANDLE_ERROR]);

  return (
    <div className="flex flex-col bg-white w-full py-2 rounded-b-3xl">
      <div className="flex items-center">
        <div className="mx-2">
          <Avatar size="sm" variant="circular" src={user?.photoURL || avatar} />
        </div>
        <div className="w-full pr-2">
          <form className="flex items-center w-full" onSubmit={addComment}>
            <input
              type="text"
              placeholder="Write a comment..."
              className="w-full rounded-2xl outline-none border p-2 bg-gray-100"
              ref={commentRef}
            />
            <button
              type="submit"
              disabled={isSubmitting} // ✅ Prevent multiple submissions
              className={`ml-2 px-3 py-1 text-white text-sm font-medium rounded-lg ${
                isSubmitting ? "bg-gray-400 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600"
              } transition`}
            >
              {isSubmitting ? "Posting..." : "Comment"}
            </button>
          </form>
        </div>
      </div>
      {state?.comments?.map((comment, index) => (
        <Comment key={index} image={comment?.image} name={comment?.name} comment={comment?.comment} />
      ))}
    </div>
  );
};

export default CommentSection;
