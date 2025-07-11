'use client';

import React from 'react';
import { FileText } from 'lucide-react';
import type { BasicInfo } from '@/types';

interface BasicInfoFormProps {
	basicInfo: BasicInfo;
	setBasicInfo: (info: BasicInfo) => void;
}

export default function BasicInfoForm({
	basicInfo,
	setBasicInfo,
}: BasicInfoFormProps) {
	return (
		<div className="bg-white rounded-xl shadow-lg overflow-hidden">
			<div
				className="px-6 py-4"
				style={{
					background: 'linear-gradient(135deg, #199875 0%, #188869 100%)',
				}}
			>
				<h2 className="text-xl font-semibold text-white flex items-center">
					<FileText className="mr-2 h-5 w-5" />
					Informació de la Licitació
				</h2>
			</div>

			<div className="p-6">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div>
						<label
							className="block text-sm font-medium mb-2"
							style={{ color: '#1c1c1c' }}
						>
							Títol de la Licitació *
						</label>
						<input
							type="text"
							value={basicInfo.title}
							onChange={(e) =>
								setBasicInfo({ ...basicInfo, title: e.target.value })
							}
							className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-opacity-50 focus:border-transparent"
							style={{
								borderColor: '#dfe7e6',
								color: '#1c1c1c',
							}}
							placeholder="Ex: Servei de consultoria tecnològica"
						/>
					</div>

					<div>
						<label
							className="block text-sm font-medium mb-2"
							style={{ color: '#1c1c1c' }}
						>
							Número d'Expedient *
						</label>
						<input
							type="text"
							value={basicInfo.expedient}
							onChange={(e) =>
								setBasicInfo({ ...basicInfo, expedient: e.target.value })
							}
							className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-opacity-50 focus:border-transparent"
							style={{
								borderColor: '#dfe7e6',
								color: '#1c1c1c',
							}}
							placeholder="Ex: EXP-2024-001"
						/>
					</div>

					<div>
						<label
							className="block text-sm font-medium mb-2"
							style={{ color: '#1c1c1c' }}
						>
							Entitat Contractant
						</label>
						<input
							type="text"
							value={basicInfo.entity}
							onChange={(e) =>
								setBasicInfo({ ...basicInfo, entity: e.target.value })
							}
							className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-opacity-50 focus:border-transparent"
							style={{
								borderColor: '#dfe7e6',
								color: '#1c1c1c',
							}}
							placeholder="Ex: Generalitat de Catalunya"
						/>
					</div>

					<div>
						<label
							className="block text-sm font-medium mb-2"
							style={{ color: '#1c1c1c' }}
						>
							Context Addicional
						</label>
						<textarea
							value={basicInfo.context}
							onChange={(e) =>
								setBasicInfo({ ...basicInfo, context: e.target.value })
							}
							rows={3}
							className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-opacity-50 focus:border-transparent"
							style={{
								borderColor: '#dfe7e6',
								color: '#1c1c1c',
							}}
							placeholder="Informació addicional rellevant per a l'avaluació..."
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
