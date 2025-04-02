import CreateVote from '../components/CreateVote';
import { useParams } from 'react-router-dom';

interface CreateVotePageProps {
  isEditMode?: boolean;
}

function CreateVotePage({ isEditMode = false }: CreateVotePageProps) {
  // URL 파라미터에서 투표 ID 가져오기
  const { id } = useParams<{ id: string }>();
  const voteId = id ? parseInt(id) : undefined;

  return (
    <div className="create-vote-page">
      <CreateVote isEditMode={isEditMode} voteId={voteId} />
    </div>
  );
}

export default CreateVotePage; 