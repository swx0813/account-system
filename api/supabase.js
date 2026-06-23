const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

module.exports = async (req, res) => {
  const { action, ...params } = req.body;
  
  try {
    let result;
    switch(action) {
      case 'register':
        result = await supabase.from('users').insert([params]);
        break;
      case 'login':
        result = await supabase.from('users').select('*')
          .eq('username', params.username)
          .eq('password', params.password);
        break;
      case 'search':
        result = await supabase.from('users').select('*')
          .ilike('username', `%${params.keyword}%`);
        break;
      case 'sendFriendRequest':
        result = await supabase.from('friend_requests').insert([params]);
        break;
      case 'getFriendRequests':
        result = await supabase.from('friend_requests').select('*')
          .eq('to_user_id', params.userId)
          .eq('status', 'pending');
        break;
      case 'getFriends':
        const [data1, data2] = await Promise.all([
          supabase.from('friends').select('*').eq('user_id', params.userId),
          supabase.from('friends').select('*').eq('friend_id', params.userId)
        ]);
        result = { data: [...(data1.data || []), ...(data2.data || [])] };
        break;
      case 'acceptFriend':
        await supabase.from('friend_requests').update({ status: 'accepted' })
          .eq('id', params.requestId);
        await supabase.from('friends').insert([params.friendData1]);
        await supabase.from('friends').insert([params.friendData2]);
        result = { data: [] };
        break;
      case 'rejectFriend':
        result = await supabase.from('friend_requests').update({ status: 'rejected' })
          .eq('id', params.requestId);
        break;
      case 'deleteFriend':
        await supabase.from('friends').delete()
          .eq('user_id', params.userId)
          .eq('friend_id', params.friendId);
        await supabase.from('friends').delete()
          .eq('friend_id', params.userId)
          .eq('user_id', params.friendId);
        result = { data: [] };
        break;
      default:
        throw new Error('未知操作');
    }
    
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};