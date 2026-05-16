package com.shopjoy.ecadminapi.base.zz.service;

import com.shopjoy.ecadminapi.base.zz.data.dto.ZzSample1Dto;
import com.shopjoy.ecadminapi.base.zz.data.dto.ZzSample2Dto;
import com.shopjoy.ecadminapi.base.zz.data.dto.ZzSample3Dto;
import com.shopjoy.ecadminapi.base.zz.data.entity.ZzSample2;
import com.shopjoy.ecadminapi.base.zz.repository.ZzSample1Repository;
import com.shopjoy.ecadminapi.base.zz.repository.ZzSample2Repository;
import com.shopjoy.ecadminapi.base.zz.repository.ZzSample3Repository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import com.shopjoy.ecadminapi.common.util.VoUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ZzSample2Service {

    private final ZzSample1Repository zzSample1Repository;
    private final ZzSample2Repository zzSample2Repository;
    private final ZzSample3Repository zzSample3Repository;

    @PersistenceContext
    private EntityManager em;

    /** getById — 조회 (상위 sample1 단건 / 하위 sample3s 포함) */
    public ZzSample2Dto.Item getById(String id) {
        ZzSample2Dto.Item dto = zzSample2Repository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        _itemFillRelations(dto);
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public ZzSample2Dto.Item getByIdOrNull(String id) {
        return zzSample2Repository.selectById(id).orElse(null);
    }

    /** findById — 엔티티 조회 */
    public ZzSample2 findById(String id) {
        return zzSample2Repository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public ZzSample2 findByIdOrNull(String id) {
        return zzSample2Repository.findById(id).orElse(null);
    }

    /** existsById — 존재 확인 */
    public boolean existsById(String id) {
        return zzSample2Repository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!zzSample2Repository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /** getList — 조회 (각 항목에 상위 sample1 / 하위 sample3s 포함) */
    public List<ZzSample2Dto.Item> getList(ZzSample2Dto.Request req) {
        List<ZzSample2Dto.Item> list = zzSample2Repository.selectList(req);
        _listFillRelations(list);
        return list;
    }

    /** getPageData — 조회 (각 항목에 상위 sample1 / 하위 sample3s 포함) */
    public ZzSample2Dto.PageResponse getPageData(ZzSample2Dto.Request req) {
        PageHelper.addPaging(req);
        ZzSample2Dto.PageResponse res = zzSample2Repository.selectPageList(req);
        _listFillRelations(res.getPageList());
        return res;
    }

    /**
     * _listFillRelations — 목록 일괄 연관조회 (상위 sample1 단건 / 하위 sample3s 목록을 각각 한 번의 쿼리로 조회 후 분배)
     * 행마다 쿼리하는 _itemFillRelations 와 달리, N개 행이라도 sample1 1회 + sample3 1회만 조회한다.
     */
    private void _listFillRelations(List<ZzSample2Dto.Item> list) {
        if (list == null || list.isEmpty()) return;

        // 부모 키 수집 (중복 제거)
        List<String> sample1Ids = list.stream()
            .map(ZzSample2Dto.Item::getSample1Id)
            .filter(Objects::nonNull)
            .distinct()
            .toList();
        List<String> sample2Ids = list.stream()
            .map(ZzSample2Dto.Item::getSample2Id)
            .filter(Objects::nonNull)
            .distinct()
            .toList();

        // 상위 sample1 일괄조회 → Map<sample1Id, sample1>
        Map<String, ZzSample1Dto.Item> sample1Map = sample1Ids.isEmpty() ? Map.of()
            : zzSample1Repository.selectList(reqSample1(sample1Ids)).stream()
                .collect(Collectors.toMap(ZzSample1Dto.Item::getSample1Id, x -> x, (a, b) -> a));

        // 하위 sample3 일괄조회 → Map<sample2Id, List<sample3>>
        Map<String, List<ZzSample3Dto.Item>> sample3Map = sample2Ids.isEmpty() ? Map.of()
            : zzSample3Repository.selectList(reqSample3(sample2Ids)).stream()
                .collect(Collectors.groupingBy(ZzSample3Dto.Item::getSample2Id));

        // 각 항목에 분배
        for (ZzSample2Dto.Item item : list) {
            item.setSample1(sample1Map.get(item.getSample1Id()));
            item.setSample3s(sample3Map.getOrDefault(item.getSample2Id(), List.of()));
        }
    }

    private ZzSample1Dto.Request reqSample1(List<String> sample1Ids) {
        ZzSample1Dto.Request req1 = new ZzSample1Dto.Request();
        req1.setSample1Ids(sample1Ids);
        return req1;
    }

    private ZzSample3Dto.Request reqSample3(List<String> sample2Ids) {
        ZzSample3Dto.Request req3 = new ZzSample3Dto.Request();
        req3.setSample2Ids(sample2Ids);
        return req3;
    }

    /** 상위 계층(sample1) + 하위 계층(sample3s) 채우기 */
    private void _itemFillRelations(ZzSample2Dto.Item item) {
        // 상위 sample1 단건 (sample1_id FK)
        if (StringUtils.hasText(item.getSample1Id()))
            item.setSample1(zzSample1Repository.selectById(item.getSample1Id()).orElse(null));

        // 하위 sample3 목록 (sample2_id FK)
        ZzSample3Dto.Request req3 = new ZzSample3Dto.Request();
        req3.setSample2Id(item.getSample2Id());
        item.setSample3s(zzSample3Repository.selectList(req3));
    }

    /** create — 생성 */
    @Transactional
    public ZzSample2 create(ZzSample2 body) {
        body.setSample2Id(CmUtil.generateId("zz_sample2"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        ZzSample2 saved = zzSample2Repository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        return saved;
    }

    /** save — 저장 (단건) */
    @Transactional
    public ZzSample2 save(ZzSample2 entity) {
        if (entity.getSample2Id() == null || !zzSample2Repository.existsById(entity.getSample2Id()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getSample2Id() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        return zzSample2Repository.save(entity);
    }

    /** update — 수정 */
    @Transactional
    public ZzSample2 update(String id, ZzSample2 body) {
        ZzSample2 entity = zzSample2Repository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
        VoUtil.voCopyExclude(body, entity, "sample2Id^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        ZzSample2 saved = zzSample2Repository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /** updateSelective — 부분 수정 (selective) */
    @Transactional
    public int updateSelective(ZzSample2 entity) {
        return zzSample2Repository.updateSelective(entity);
    }

    /** delete — 삭제 */
    @Transactional
    public void delete(String id) {
        ZzSample2 entity = zzSample2Repository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
        zzSample2Repository.delete(entity);
        em.flush();
        if (zzSample2Repository.existsById(id))
            throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    /** saveList — 일괄 저장 */
    @Transactional
    public void saveList(List<ZzSample2> rows) {
        zzSample2Repository.saveAll(rows);
    }
}
