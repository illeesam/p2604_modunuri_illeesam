package com.shopjoy.ecadminapi.bo.ec.mb.service;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbMemberDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMember;
import com.shopjoy.ecadminapi.base.ec.mb.service.MbMemberService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * BO 고객정보(CustInfo) 서비스 — base MbMemberService 위임 (thin wrapper).
 * 회원 데이터를 고객정보 관점에서 다룸.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoMbCustInfoService {

    private final MbMemberService mbMemberService;

    public MbMemberDto.Item getById(String id) { return mbMemberService.getById(id); }
    public List<MbMemberDto.Item> getList(MbMemberDto.Request req) { return mbMemberService.getList(req); }
    public MbMemberDto.PageResponse getPageData(MbMemberDto.Request req) { return mbMemberService.getPageData(req); }

    @Transactional public MbMember create(MbMember body) { return mbMemberService.create(body); }
    @Transactional public MbMember update(String id, MbMember body) { return mbMemberService.update(id, body); }
    @Transactional public void delete(String id) { mbMemberService.delete(id); }
}
