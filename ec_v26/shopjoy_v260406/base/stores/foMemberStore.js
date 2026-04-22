/**
 * FO (Front Office) 회원 정보 Pinia 스토어
 */
window.useFoMemberStore = Pinia.defineStore('foMember', {
  state: () => {
    return {
      member: {
        memberId: '',
        memberEmail: '',
        memberNm: '',
        siteId: '',
        memberHpNo: '',
        memberGrade: '',
        memberStaffYn: 'N',
        memberBirthDt: '',
        memberStatusCd: '',
        cartCount: 0,
        likeCount: 0,
      },
    };
  },

  getters: {
    isInitialized: (s) => !!(s.member && s.member.memberId),
  },

  actions: {
    setMember(memberData) {
      if (memberData) {
        this.member = {
          memberId: memberData.memberId || '',
          memberEmail: memberData.memberEmail || '',
          memberNm: memberData.memberNm || '',
          siteId: memberData.siteId || '',
          memberHpNo: memberData.memberHpNo || '',
          memberGrade: memberData.memberGrade || '',
          memberStaffYn: memberData.memberStaffYn || 'N',
          memberBirthDt: memberData.memberBirthDt || '',
          memberStatusCd: memberData.memberStatusCd || '',
          cartCount: memberData.cartCount || 0,
          likeCount: memberData.likeCount || 0,
        };

        try {
          localStorage.setItem('modu-fo-user', JSON.stringify(this.member));
        } catch (e) {
          console.error('[foMemberStore] setMember localStorage error:', e);
        }
      }
    },

    updateMember(memberData) {
      if (memberData) {
        this.member = {
          ...this.member,
          ...memberData,
        };

        try {
          localStorage.setItem('modu-fo-user', JSON.stringify(this.member));
        } catch (e) {
          console.error('[foMemberStore] updateMember localStorage error:', e);
        }
      }
    },

    clear() {
      this.member = {
        memberId: '',
        memberEmail: '',
        memberNm: '',
        siteId: '',
        memberHpNo: '',
        memberGrade: '',
        memberStaffYn: 'N',
        memberBirthDt: '',
        memberStatusCd: '',
        cartCount: 0,
        likeCount: 0,
      };

      try {
        localStorage.removeItem('modu-fo-user');
      } catch (e) {
        console.error('[foMemberStore] clear localStorage error:', e);
      }
    },

    restoreFromStorage() {
      try {
        const userJson = localStorage.getItem('modu-fo-user');

        if (userJson) {
          this.member = JSON.parse(userJson);
          return true;
        }

        return false;
      } catch (e) {
        console.error('[foMemberStore] restoreFromStorage error:', e);
        return false;
      }
    },
  },
});
