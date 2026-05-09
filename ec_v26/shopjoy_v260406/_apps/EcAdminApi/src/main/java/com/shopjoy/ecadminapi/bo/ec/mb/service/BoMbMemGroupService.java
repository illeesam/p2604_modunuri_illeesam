package com.shopjoy.ecadminapi.bo.ec.mb.service;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbMemberGroupDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMemberGroup;
import com.shopjoy.ecadminapi.base.ec.mb.service.MbMemberGroupService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * BO 회원그룹 서비스 — base MbMemberGroupService 위임 (thin wrapper).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoMbMemGroupService {

    private final MbMemberGroupService mbMemberGroupService;

    public MbMemberGroupDto.Item getById(String id) { return mbMemberGroupService.getById(id); }
    public List<MbMemberGroupDto.Item> getList(MbMemberGroupDto.Request req) { return mbMemberGroupService.getList(req); }
    public MbMemberGroupDto.PageResponse getPageData(MbMemberGroupDto.Request req) { return mbMemberGroupService.getPageData(req); }

    @Transactional public MbMemberGroup create(MbMemberGroup body) {
        if (body.getUseYn() == null) body.setUseYn("Y");
        return mbMemberGroupService.create(body);
    }
    @Transactional public MbMemberGroup update(String id, MbMemberGroup body) { return mbMemberGroupService.update(id, body); }
    @Transactional public void delete(String id) { mbMemberGroupService.delete(id); }
    @Transactional public List<MbMemberGroup> saveList(List<MbMemberGroup> rows) { return mbMemberGroupService.saveList(rows); }
}
