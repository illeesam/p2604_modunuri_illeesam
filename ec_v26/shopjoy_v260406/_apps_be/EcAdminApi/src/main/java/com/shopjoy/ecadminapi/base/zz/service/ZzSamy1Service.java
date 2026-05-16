package com.shopjoy.ecadminapi.base.zz.service;

import com.shopjoy.ecadminapi.base.zz.data.dto.ZzSamy1Dto;
import com.shopjoy.ecadminapi.base.zz.data.dto.ZzSamy2Dto;
import com.shopjoy.ecadminapi.base.zz.data.dto.ZzSamy3Dto;
import com.shopjoy.ecadminapi.base.zz.data.entity.ZzSamy1;
import com.shopjoy.ecadminapi.base.zz.mapper.ZzSamy1Mapper;
import com.shopjoy.ecadminapi.base.zz.mapper.ZzSamy2Mapper;
import com.shopjoy.ecadminapi.base.zz.mapper.ZzSamy3Mapper;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ZzSamy1Service {

    private final ZzSamy1Mapper zzSamy1Mapper;
    private final ZzSamy2Mapper zzSamy2Mapper;
    private final ZzSamy3Mapper zzSamy3Mapper;

    /** getById — 조회 */
    public ZzSamy1Dto.Item getById(String samy1Id) {
        ZzSamy1Dto.Item dto = zzSamy1Mapper.selectById(samy1Id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + samy1Id + "::" + CmUtil.svcCallerInfo(this));
        _itemFillRelations(dto);
        return dto;
    }

    /** getList — 조회 (각 항목에 하위 samy2s / samy3s 포함) */
    public List<ZzSamy1Dto.Item> getList(ZzSamy1Dto.Request req) {
        List<ZzSamy1Dto.Item> list = zzSamy1Mapper.selectList(req);
        _listFillRelations(list);
        return list;
    }

    /** getPageData — 조회 (각 항목에 하위 samy2s / samy3s 포함) */
    public ZzSamy1Dto.PageResponse getPageData(ZzSamy1Dto.Request req) {
        PageHelper.addPaging(req);
        List<ZzSamy1Dto.Item> list = zzSamy1Mapper.selectPageList(req);
        _listFillRelations(list);
        long total = zzSamy1Mapper.selectPageCount(req);
        ZzSamy1Dto.PageResponse res = new ZzSamy1Dto.PageResponse();
        return res.setPageInfo(list, total, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    /**
     * _listFillRelations — 목록 일괄 연관조회 (하위 samy2s / samy3s 목록을 각각 한 번의 쿼리로 조회 후 분배)
     * 행마다 쿼리하는 _itemFillRelations 와 달리, N개 행이라도 samy2 1회 + samy3 1회만 조회한다.
     */
    private void _listFillRelations(List<ZzSamy1Dto.Item> list) {
        if (list == null || list.isEmpty()) return;

        // 부모 키 수집 (중복 제거)
        List<String> samy1Ids = list.stream()
            .map(ZzSamy1Dto.Item::getSamy1Id)
            .filter(StringUtils::hasText)
            .distinct()
            .toList();
        if (samy1Ids.isEmpty()) return;

        // 하위 samy2 일괄조회 → Map<samy1Id, List<samy2>>
        ZzSamy2Dto.Request req2 = new ZzSamy2Dto.Request();
        req2.setSamy1Ids(samy1Ids);
        Map<String, List<ZzSamy2Dto.Item>> samy2Map = zzSamy2Mapper.selectList(req2).stream()
            .collect(Collectors.groupingBy(ZzSamy2Dto.Item::getSamy1Id));

        // 하위 samy3 일괄조회 → Map<samy1Id, List<samy3>>
        ZzSamy3Dto.Request req3 = new ZzSamy3Dto.Request();
        req3.setSamy1Ids(samy1Ids);
        Map<String, List<ZzSamy3Dto.Item>> samy3Map = zzSamy3Mapper.selectList(req3).stream()
            .collect(Collectors.groupingBy(ZzSamy3Dto.Item::getSamy1Id));

        // 각 항목에 분배
        for (ZzSamy1Dto.Item item : list) {
            item.setSamy2s(samy2Map.getOrDefault(item.getSamy1Id(), List.of()));
            item.setSamy3s(samy3Map.getOrDefault(item.getSamy1Id(), List.of()));
        }
    }

    /** 하위 계층(samy2s/samy3s) 채우기 */
    private void _itemFillRelations(ZzSamy1Dto.Item item) {
        ZzSamy2Dto.Request req2 = new ZzSamy2Dto.Request();
        req2.setSamy1Id(item.getSamy1Id());
        item.setSamy2s(zzSamy2Mapper.selectList(req2));

        ZzSamy3Dto.Request req3 = new ZzSamy3Dto.Request();
        req3.setSamy1Id(item.getSamy1Id());
        item.setSamy3s(zzSamy3Mapper.selectList(req3));
    }

    /** create — 생성 */
    @Transactional
    public ZzSamy1 create(ZzSamy1 body) {
        body.setSamy1Id(CmUtil.generateId("zz_samy1"));
        body.setRgtr(SecurityUtil.getAuthUser().authId());
        body.setRegDt(LocalDate.now());
        body.setMdfr(SecurityUtil.getAuthUser().authId());
        body.setMdfcnDt(LocalDate.now());
        if (zzSamy1Mapper.insert(body) != 1)
            throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        return body;
    }

    /** update — 수정 */
    @Transactional
    public ZzSamy1 update(String samy1Id, ZzSamy1 body) {
        if (zzSamy1Mapper.selectById(samy1Id) == null)
            throw new CmBizException("존재하지 않는 데이터입니다: " + samy1Id + "::" + CmUtil.svcCallerInfo(this));
        body.setSamy1Id(samy1Id);
        body.setMdfr(SecurityUtil.getAuthUser().authId());
        body.setMdfcnDt(LocalDate.now());
        if (zzSamy1Mapper.update(body) != 1)
            throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        return body;
    }

    /** updateSelective — 부분 수정 */
    @Transactional
    public int updateSelective(ZzSamy1 entity) {
        entity.setMdfr(SecurityUtil.getAuthUser().authId());
        entity.setMdfcnDt(LocalDate.now());
        return zzSamy1Mapper.updateSelective(entity);
    }

    /** delete — 삭제 */
    @Transactional
    public void delete(String samy1Id) {
        if (zzSamy1Mapper.selectById(samy1Id) == null)
            throw new CmBizException("존재하지 않는 데이터입니다: " + samy1Id + "::" + CmUtil.svcCallerInfo(this));
        if (zzSamy1Mapper.delete(samy1Id) != 1)
            throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }
}
