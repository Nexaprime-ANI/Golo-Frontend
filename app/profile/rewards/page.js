<<<<<<< HEAD
"use client";

import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { useEffect, useState } from "react";

export default function RewardsPage() {
	const [rewards, setRewards] = useState([]);

	useEffect(() => {
		// Placeholder: load rewards if backend available
		setRewards([]);
	}, []);

	return (
		<>
			<Navbar />
			<main className="min-h-screen p-8">
				<div className="max-w-4xl mx-auto">
					<h1 className="text-2xl font-bold mb-4">Rewards</h1>
					{rewards.length === 0 ? (
						<p className="text-gray-500">No rewards available.</p>
					) : (
						<ul>
							{rewards.map((r) => (
								<li key={r.id}>{r.title}</li>
							))}
						</ul>
					)}
				</div>
			</main>
			<Footer />
		</>
	);
=======
'use client';

export default function RewardsPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Rewards</h1>
      <p className="text-gray-600">Coming soon...</p>
    </div>
  );
>>>>>>> ab702514040ebb26ccf6345e37517ad5d0c39df4
}
