package com.shopjoy.ecBeBo.fo.ec.service;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.sy.data.dto.SyNotiDto;
import com.shopjoy.ecBeBo.base.sy.data.entity.SyNoti;
import com.shopjoy.ecBeBo.base.sy.service.SyNotiService;
import com.shopjoy.ecBeBo.common.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * FO 알림함 서비스 — 쇼핑몰 회원(recvTypeCd='MEMBER') 기준으로 스코프를 강제한다.
 * 수신자 조건을 서버에서 주입하므로 클라이언트가 recvId 를 바꿔 남의 알림을 볼 수 없다.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FoSyNotiService {

    private static final String RECV_TYPE = "MEMBER";

    private final SyNotiService syNotiService;

    /* 현재 로그인 회원 ID */
    private String me() { return SecurityUtil.getAuthUser().authId(); }

    /* 내 알림 목록 (종 드롭다운용) */
    public List<SyNotiDto.Item> getMyList(SyNotiDto.Request req) {
        req.setRecvTypeCd(RECV_TYPE);
        req.setRecvId(me());
        return syNotiService.getList(req);
    }

    /* 내 알림 페이지조회 */
    public BasePage<SyNotiDto.Item> getMyPageData(SyNotiDto.Request req) {
        req.setRecvTypeCd(RECV_TYPE);
        req.setRecvId(me());
        return syNotiService.getPageData(req);
    }

    /* 내 안읽음 건수 */
    public long getMyUnreadCount() { return syNotiService.countUnread(RECV_TYPE, me()); }

    @Transactional public SyNoti markRead(String id, String readYn) { return syNotiService.markRead(id, readYn, RECV_TYPE, me()); }
    @Transactional public int    markAllRead() { return syNotiService.markAllRead(RECV_TYPE, me()); }
    @Transactional public void   delete(String id) { syNotiService.delete(id, RECV_TYPE, me()); }
    @Transactional public int    deleteMyAll() { return syNotiService.deleteAllOf(RECV_TYPE, me()); }
}
