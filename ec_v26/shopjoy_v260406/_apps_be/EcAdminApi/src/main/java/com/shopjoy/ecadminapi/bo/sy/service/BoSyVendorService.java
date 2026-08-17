package com.shopjoy.ecadminapi.bo.sy.service;

import com.shopjoy.ecadminapi.common.data.BasePage;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyVendorDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyVendor;
import com.shopjoy.ecadminapi.base.sy.service.SyVendorService;
import com.shopjoy.ecadminapi.common.util.MaskUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * BO 거래처 서비스 — base SyVendorService 위임 (thin wrapper).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoSyVendorService {

    private final SyVendorService syVendorService;

    /* 키조회 */
    public SyVendorDto.Item getById(String id) {
        SyVendorDto.Item dto = syVendorService.getById(id);
        MaskUtil.applyMask(dto);   // 연락처/주소/계좌 마스킹 (민감정보열람 권한 없으면)
        return dto;
    }
    /* 목록조회 */
    public List<SyVendorDto.Item> getList(SyVendorDto.Request req) {
        List<SyVendorDto.Item> list = syVendorService.getList(req);
        MaskUtil.applyMask(list);   // 연락처/주소/계좌 마스킹 (민감정보열람 권한 없으면)
        return list;
    }
    /* 페이지조회 */
    public BasePage<SyVendorDto.Item> getPageData(SyVendorDto.Request req) {
        BasePage<SyVendorDto.Item> res = syVendorService.getPageData(req);
        MaskUtil.applyMask(res.getPageList());   // 연락처/주소/계좌 마스킹 (민감정보열람 권한 없으면)
        return res;
    }

    @Transactional public SyVendor create(SyVendor body) { return syVendorService.create(body); }
    @Transactional public SyVendor update(String id, SyVendor body) { return syVendorService.update(id, body); }
    @Transactional public void delete(String id) { syVendorService.delete(id); }
    @Transactional public void saveListBase(List<SyVendor> rows) { syVendorService.saveListBase(rows); }
    /** getPathTreeNodeCounts — 표시경로 노드별 SyVendor 수 (자손 누적) */
    public java.util.List<java.util.Map<String, Object>> getPathTreeNodeCounts(SyVendorDto.Request req) {
        return syVendorService.getPathTreeNodeCounts(req);
    }

}
