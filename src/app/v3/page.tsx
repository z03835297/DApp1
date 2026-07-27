"use client";

import Navbar from "@/components/Navbar";
import V3ActionPanel from "@/components/v3/V3ActionPanel";

export default function V3Page() {
	return (
		<div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950">
			<Navbar />
			<main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
				<div className="text-center mb-12">
					<h1 className="text-4xl font-bold text-white mb-3">
						Token Operations V3
					</h1>
					<p className="text-zinc-400 max-w-md mx-auto">
						Token + LimitGate + RedeemQueue · Sepolia 测试
					</p>
				</div>

				<V3ActionPanel />
			</main>
		</div>
	);
}
