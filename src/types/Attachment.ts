export type Attachment = {
    id: number,
	createdate?: Date,
	updatedate?: Date,
	filename: string,
	original_name: string,
	type: number,
	date: string | null,
	title: string | null,
	description: string | null,
	size: number,
}